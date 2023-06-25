# Sage

A bot powered by OpenAI ChatGPT and Dall-e.

## Requirements

To run the bot your'll need OpenAI API key. To deploy the bot to AWS you'll need AWS account and AWS CLI configured.

[Obtain OpenAI API key here](https://platform.openai.com/account/api-keys).

Put it to `.env` file:

```bash
OPENAI_API_KEY=...
```

## Usage

Install dependencies:

```bash
pnpm i
```

Run locally:

```bash
pnpm dev
```

Deploy with SST to AWS ([How to init AWS/SST](https://sst.dev/chapters/create-an-aws-account.html)):

```bash
pnpm sst:deploy
```
