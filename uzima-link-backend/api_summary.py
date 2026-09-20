import json

from main import app

spec = app.openapi()
schemas = spec.get("components", {}).get("schemas", {})


def resolve(node, depth=0):
    if depth > 6:
        return "..."
    if "$ref" in node:
        name = node["$ref"].split("/")[-1]
        return {name: resolve(schemas.get(name, {}), depth + 1)}
    if "properties" in node:
        return {k: resolve(v, depth + 1) for k, v in node["properties"].items()}
    if node.get("type") == "array":
        return [resolve(node.get("items", {}), depth + 1)]
    for key in ("anyOf", "oneOf", "allOf"):
        if key in node:
            return [resolve(n, depth + 1) for n in node[key] if n.get("type") != "null"]
    return node.get("type", "any")


PREFIXES = ("/doctor/", "/frontdesk/", "/patient/prescriptions", "/patient/symptoms", "/patient/consent")

for path, methods in spec["paths"].items():
    if not path.startswith(PREFIXES) or "/auth/" in path or "/profile/" in path:
        continue
    for method, op in methods.items():
        print(f"\n{method.upper()} {path}")
        params = [p["name"] for p in op.get("parameters", [])]
        if params:
            print("  params", params)
        for ctype, c in op.get("requestBody", {}).get("content", {}).items():
            print("  request", ctype, json.dumps(resolve(c.get("schema", {}))))
        for ctype, c in op.get("responses", {}).get("200", {}).get("content", {}).items():
            print("  response", json.dumps(resolve(c.get("schema", {}))))