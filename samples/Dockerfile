# Runs node create-react-app
# Expects us to bind-mount the application directory
# From the root of this project, that will look like:
# --mount type=bind,src=samples/react,dst=/project/src --mount type=bind,src=src/,dst=/project/src/lib
FROM node:8-alpine
RUN npm install -g create-react-app
RUN mkdir -p /project
WORKDIR /project
RUN /usr/local/bin/create-react-app .
RUN yarn add react-router redux
CMD [ "yarn", "start" ]