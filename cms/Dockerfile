# The CMS's image, built from the repo's root, where the lockfile is: docker build -f cms/Dockerfile -t example-cms .
FROM node:24-slim
WORKDIR /site
ENV NODE_ENV=production NO_COLOR=1

# The packages first, so a change to the content types doesn't reinstall them. npm ci checks every workspace against
# the lockfile, so web's package.json comes too, but it installs only the cms workspace's packages.
COPY package.json package-lock.json ./
COPY cms/package.json cms/
COPY web/package.json web/
RUN npm ci --omit=dev --workspace cms --no-audit --no-fund
COPY cms cms

WORKDIR /site/cms
# The admin, with the plugins sorlo.config.ts lists, which sorlo start serves
RUN ../node_modules/.bin/sorlo build
# The local disk's folder, for a deploy without a bucket, which a volume keeps
RUN mkdir -p storage && chown node:node storage
USER node
EXPOSE 4100
# The command itself rather than npm, so SIGTERM reaches it
CMD ["../node_modules/.bin/sorlo", "start"]
