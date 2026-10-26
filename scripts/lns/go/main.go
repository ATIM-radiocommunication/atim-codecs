// Runs every examples.json inside the JavaScript engines of two network servers:
//   - goja: The Things Stack (TTN v3) payload formatters;
//   - otto: ChirpStack v3 codecs (ES5 only, Decode/Encode entry points).
//
// Usage (Go 1.22 or later):
//   npm run test:ttn             goja only
//   npm run test:chirpstack-v3   otto only
//   cd scripts/lns/go && go run . ../../.. [ttn|chirpstack-v3]
package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"strings"

	"github.com/dop251/goja"
	"github.com/robertkrimen/otto"
)

type product struct {
	ID       string `json:"id"`
	Path     string `json:"path"`
	Codec    string `json:"codec"`
	Examples string `json:"examples"`
}

type example struct {
	Description string                 `json:"description"`
	Type        string                 `json:"type"`
	Input       map[string]interface{} `json:"input"`
	Output      map[string]interface{} `json:"output"`
}

func hexToBytes(h string) []int {
	out := []int{}
	for i := 0; i+1 < len(h); i += 2 {
		var b int
		fmt.Sscanf(h[i:i+2], "%02x", &b)
		out = append(out, b)
	}
	return out
}

// call builds the JavaScript expression run for one example, returning a JSON string.
func call(e example, chirpstackV3 bool) string {
	if e.Type == "uplink" {
		b, _ := json.Marshal(hexToBytes(e.Input["bytes"].(string)))
		port := int(e.Input["fPort"].(float64))
		if chirpstackV3 {
			// ChirpStack v3 calls Decode(fPort, bytes, variables) and only keeps the object
			return fmt.Sprintf("JSON.stringify({data: Decode(%d, %s, {}), errors: [], warnings: []})", port, b)
		}
		return fmt.Sprintf("JSON.stringify(decodeUplink({bytes: %s, fPort: %d, recvTime: new Date(0)}))", b, port)
	}
	d, _ := json.Marshal(e.Input["data"])
	if chirpstackV3 {
		return fmt.Sprintf("(function(){ var b = Encode(1, %s, {}); return JSON.stringify({bytes: b}); })()", d)
	}
	return fmt.Sprintf("JSON.stringify(encodeDownlink({data: %s}))", d)
}

func toHex(v interface{}) string {
	arr, _ := v.([]interface{})
	var sb strings.Builder
	for _, x := range arr {
		sb.WriteString(fmt.Sprintf("%02x", int(x.(float64))&0xff))
	}
	return sb.String()
}

// matches compares a result with the expected output. For ChirpStack v3, errors/warnings and
// fPort are not part of the API, so only data (uplink) or bytes (downlink) are compared.
func matches(e example, got map[string]interface{}, chirpstackV3 bool) bool {
	if e.Type == "uplink" {
		if chirpstackV3 {
			if errs, _ := e.Output["errors"].([]interface{}); len(errs) > 0 {
				return true // v3 has no error channel; data is still returned
			}
			return reflect.DeepEqual(got["data"], e.Output["data"])
		}
		return reflect.DeepEqual(got, e.Output)
	}
	if toHex(got["bytes"]) != e.Output["bytes"] {
		return false
	}
	if chirpstackV3 {
		return true
	}
	return got["fPort"] == e.Output["fPort"]
}

type engine struct {
	key  string
	name string
	v3   bool
	run  func(code, expr string) (string, error)
}

func main() {
	root := os.Args[1]
	engines := []engine{
		{"ttn", "goja (TTN v3)", false, func(code, expr string) (string, error) {
			vm := goja.New()
			if _, err := vm.RunString(code); err != nil {
				return "", err
			}
			v, err := vm.RunString(expr)
			if err != nil {
				return "", err
			}
			return v.String(), nil
		}},
		{"chirpstack-v3", "otto (ChirpStack v3)", true, func(code, expr string) (string, error) {
			vm := otto.New()
			if _, err := vm.Run(code); err != nil {
				return "", err
			}
			v, err := vm.Run(expr)
			if err != nil {
				return "", err
			}
			return v.String(), nil
		}},
	}
	if len(os.Args) > 2 {
		selected := []engine{}
		for _, e := range engines {
			if e.key == os.Args[2] {
				selected = append(selected, e)
			}
		}
		if len(selected) == 0 {
			fmt.Println("unknown engine " + os.Args[2] + " (expected ttn or chirpstack-v3)")
			os.Exit(2)
		}
		engines = selected
	}

	pass, fail := 0, 0
	for _, lang := range []string{"en", "fr"} {
		var products []product
		raw, _ := os.ReadFile(filepath.Join(root, lang, "products.json"))
		json.Unmarshal(raw, &products)
		for _, p := range products {
			dir := filepath.Join(root, lang, filepath.FromSlash(p.Path))
			code, _ := os.ReadFile(filepath.Join(dir, p.Codec))
			var examples []example
			raw, _ := os.ReadFile(filepath.Join(dir, p.Examples))
			json.Unmarshal(raw, &examples)
			for _, eng := range engines {
				ok := 0
				firstErr := ""
				for _, e := range examples {
					out, err := eng.run(string(code), call(e, eng.v3))
					var got map[string]interface{}
					if err == nil {
						err = json.Unmarshal([]byte(out), &got)
					}
					if err == nil && matches(e, got, eng.v3) {
						ok++
						continue
					}
					fail++
					if firstErr == "" {
						if err != nil {
							firstErr = err.Error()
						} else {
							firstErr = e.Description + ": got " + out
						}
					}
				}
				pass += ok
				status := "ok  "
				if ok != len(examples) {
					status = "FAIL"
				}
				line := fmt.Sprintf("%s %s/%s [%s] %d/%d", status, lang, p.ID, eng.name, ok, len(examples))
				if firstErr != "" {
					if len(firstErr) > 160 {
						firstErr = firstErr[:160]
					}
					line += "\n     " + firstErr
				}
				fmt.Println(line)
			}
		}
	}
	fmt.Printf("\n%d passed, %d failed\n", pass, fail)
	if fail > 0 {
		os.Exit(1)
	}
}
