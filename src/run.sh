#!/bin/bash

INPUT=data.csv
API_URL="https://api.restful-api.dev/objects"

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

  curl -X POST "$API_URL" \
    -H "accept: */*" \
    -H "content-type: application/json" \
    -d "$json"

  echo -e "\n----------------------------------------\n"
done
