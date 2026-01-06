#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WRAPPER_JAR="$ROOT_DIR/gradle/wrapper/gradle-wrapper.jar"
PROPS_FILE="$ROOT_DIR/gradle/wrapper/gradle-wrapper.properties"

if [[ -f "$WRAPPER_JAR" ]]; then
  echo "gradle-wrapper.jar already exists. Skipping download."
  exit 0
fi

if [[ ! -f "$PROPS_FILE" ]]; then
  echo "Missing $PROPS_FILE; cannot determine distributionUrl" >&2
  exit 1
fi

DISTRIBUTION_URL=$(grep '^distributionUrl=' "$PROPS_FILE" | cut -d'=' -f2-)
if [[ -z "$DISTRIBUTION_URL" ]]; then
  echo "distributionUrl not found in $PROPS_FILE" >&2
  exit 1
fi

echo "Downloading Gradle distribution from $DISTRIBUTION_URL" >&2
TMP_ZIP=$(mktemp)
trap 'rm -f "$TMP_ZIP"' EXIT
curl -L "$DISTRIBUTION_URL" -o "$TMP_ZIP"

# Extract the wrapper JAR from the distribution without unpacking everything
UNZIP_DIR=$(mktemp -d)
trap 'rm -rf "$UNZIP_DIR"; rm -f "$TMP_ZIP"' EXIT
unzip -q "$TMP_ZIP" "gradle-*/lib/gradle-wrapper-*.jar" -d "$UNZIP_DIR"
FOUND_JAR=$(find "$UNZIP_DIR" -name "gradle-wrapper-*.jar" | head -n 1)
if [[ -z "$FOUND_JAR" ]]; then
  echo "Could not locate gradle-wrapper jar inside distribution" >&2
  exit 1
fi
mkdir -p "$(dirname "$WRAPPER_JAR")"
cp "$FOUND_JAR" "$WRAPPER_JAR"
echo "Saved wrapper jar to $WRAPPER_JAR"
