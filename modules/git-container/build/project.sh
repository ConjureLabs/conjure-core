#! /bin/bash

BASE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";
. $BASE/../vars.cfg;

# see http://stackoverflow.com/questions/407523/escape-a-string-for-a-sed-replace-pattern
TARGET_TEMPLATE=$(sed 's/[\/&]/\\&/g' <<< $1);
TARGET_REPO=$(sed 's/[\/&]/\\&/g' <<< $2); # -e?
TARGET_BRANCH=$(sed 's/[\/&]/\\&/g' <<< $3);
CONTAINER_UID=$(sed 's/[\/&]/\\&/g' <<< $4);
CONTAINER_NAME=$5;
AWS_ECR_URL=$6;
TARGET_PRE_SETUP=$(sed 's/[\/&]/\\&/g' <<< $7);
TARGET_SETUP=$(sed 's/[\/&]/\\&/g' <<< $8);
START_COMMAND=$9;
CACHEBUST=$(date +%s);
CONJURE_FILES=$(sed 's/[\/&]/\\&/g' <<< $(cd $GIT_CONTAINER_DIR; cd ./conjure-files; pwd));

echo "$CONJURE_FILES";

DOCKERFILE_CONTENT=$(cat "$GIT_CONTAINER_DIR/template.Dockerfile");
DOCKERFILE_CONTENT=$(sed "s/<TEMPLATE>/$TARGET_TEMPLATE/g" <<< "$DOCKERFILE_CONTENT");
DOCKERFILE_CONTENT=$(sed "s/<REPO>/$TARGET_REPO/g" <<< "$DOCKERFILE_CONTENT");
DOCKERFILE_CONTENT=$(sed "s/<BRANCH>/$TARGET_BRANCH/g" <<< "$DOCKERFILE_CONTENT");
DOCKERFILE_CONTENT=$(sed "s/<CACHEBUST>/$CACHEBUST/g" <<< "$DOCKERFILE_CONTENT");

echo "$TARGET_PRE_SETUP";

if [ "$TARGET_PRE_SETUP" != "" ]; then
  TARGET_PRE_SETUP=$(echo $TARGET_PRE_SETUP | base64 --decode);
  DOCKERFILE_CONTENT+=$(echo -e "\n$TARGET_PRE_SETUP\n");
fi
DOCKERFILE_CONTENT+=$(echo -e "\nRUN $TARGET_SETUP");

echo "TEMP DIR: $TEMP_PROJECT_DOCKERFILE_DIR";

echo "$DOCKERFILE_CONTENT" > "$TEMP_PROJECT_DOCKERFILE_DIR/$CONTAINER_UID.Dockerfile";

# copy over base entrypoint file, to this project's tmp dir
cp "$GIT_CONTAINER_DIR/conjure-files/entrypoint.sh" "$TEMP_PROJECT_DOCKERFILE_DIR/entrypoint.sh";
# append start command to file
echo "$START_COMMAND" >> "$TEMP_PROJECT_DOCKERFILE_DIR/entrypoint.sh";

docker build -t "$AWS_ECR_URL$CONTAINER_NAME:latest" -f "$TEMP_PROJECT_DOCKERFILE_DIR/$CONTAINER_UID.Dockerfile" "$TEMP_PROJECT_DOCKERFILE_DIR";
