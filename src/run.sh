#!/bin/bash

INPUT=data.csv
API_URL="https://api.restful-api.dev/objects"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT="$SCRIPT_DIR/createdIds.json"

tmp_ids=$(mktemp)

# Skip the header
tail -n +2 "$INPUT" | while IFS=',' read -r name email role
do
  json=$(jq -n \
        --arg name "$name" \
        --arg email "$email" \
        --arg role "$role" \
        '{name: $name, data: {email: $email, role: $role}}'
      )

  echo "Sending request for: $name"

  resp=$(curl -s -X POST "$API_URL" \
    -H "accept: */*" \
    -H "content-type: application/json" \
    -d "$json")

  echo "$resp"

  id=$(echo "$resp" | jq -r '.id // empty')
  if [ -n "$id" ]; then
    echo "$id" >> "$tmp_ids"
  fi

  echo -e "\n----------------------------------------\n"
done

# Merge with existing JSON file if present
existing_ids_json="[]"
if [ -f "$OUTPUT" ]; then
  existing_ids_json=$(cat "$OUTPUT")
fi

new_ids_json=$(cat "$tmp_ids" | jq -R . | jq -s .)

merged=$(jq -n --argjson a "$existing_ids_json" --argjson b "$new_ids_json" '$a + $b | unique')

echo "$merged" > "$OUTPUT"
rm -f "$tmp_ids"
echo "Saved IDs to $OUTPUT"
