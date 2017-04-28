#! /bin/bash

BASE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";
. $BASE/vars.cfg;

# see http://stackoverflow.com/questions/407523/escape-a-string-for-a-sed-replace-pattern
TARGET_REPO=$(sed 's/[\/&]/\\&/g' <<< $1); # -e?
TARGET_BRANCH=$(sed 's/[\/&]/\\&/g' <<< $2);
CONTAINER_NAME=$(sed 's/[\/&]/\\&/g' <<< $3);
TARGET_PRE_SETUP=$(sed 's/[\/&]/\\&/g' <<< $4);
TARGET_SETUP=$(sed 's/[\/&]/\\&/g' <<< $5);
CACHEBUST=$(date +%s);

DOCKERFILE_CONTENT=$(cat "$PROJECT_DIR/template.Dockerfile");
DOCKERFILE_CONTENT=$(sed "s/<REPO>/$TARGET_REPO/g" <<< "$DOCKERFILE_CONTENT");
DOCKERFILE_CONTENT=$(sed "s/<BRANCH>/$TARGET_BRANCH/g" <<< "$DOCKERFILE_CONTENT");
DOCKERFILE_CONTENT=$(sed "s/<CACHEBUST>/$CACHEBUST/g" <<< "$DOCKERFILE_CONTENT");

echo "$TARGET_PRE_SETUP";

if [ "$TARGET_PRE_SETUP" != "" ]; then
  TARGET_PRE_SETUP=$(echo $TARGET_PRE_SETUP | base64 --decode);
  DOCKERFILE_CONTENT+=$(echo -e "\n$TARGET_PRE_SETUP\n");
fi
DOCKERFILE_CONTENT+=$(echo -e "\nRUN $TARGET_SETUP");

echo "$DOCKERFILE_CONTENT" > "$PROJECT_DIR/current.Dockerfile";

docker build -t "$CONTAINER_NAME:latest" -f "$PROJECT_DIR/current.Dockerfile" .;
