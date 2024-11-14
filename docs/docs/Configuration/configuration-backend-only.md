---
title: Run Langflow in backend-only mode
sidebar_position: 4
slug: /configuration-backend-only
---

Langflow can run in `--backend-only` mode to expose a Langflow app as an API endpoint, without running the frontend UI.
This is also known as "headless" mode. Running Langflow without the frontend is useful for automation, testing, and situations where you just need to serve a flow as a workload without creating a new flow in the UI.

To run Langflow in backend-only mode, pass the `--backend-only` flag at startup.

```python
python3 -m langflow run --backend-only
```

The terminal prints `Welcome to ⛓ Langflow`, and Langflow will now serve requests to its API without the frontend running.

## Set up a basic prompting flow in backend-only mode

This example shows you how to set up a [Basic Prompting flow](/starter-projects-basic-prompting) as an endpoint in backend-only mode.
However, you can use these same instructions as guidelines for using any type of flow in backend-only mode.

### Prerequisites

- [Langflow is installed](/getting-started-installation)
- [You have an OpenAI API key](https://platform.openai.com/)
- [You have a Langflow Basic Prompting flow](/starter-projects-basic-prompting)

### Get your flow's ID

This guide assumes you have created a [Basic Prompting flow](/starter-projects-basic-prompting) or have another working flow available.

1. In the Langflow UI, click **API**.
2. Click **curl** &gt; **Copy code** to copy the curl command.
This command will POST input to your flow's endpoint.
It will look something like this:

```text
curl -X POST \
    "http://127.0.0.1:7861/api/v1/run/fff8dcaa-f0f6-4136-9df0-b7cb38de42e0?stream=false" \
    -H 'Content-Type: application/json'\
    -d '{"input_value": "message",
    "output_type": "chat",
    "input_type": "chat",
    "tweaks": {
  "ChatInput-8a86T": {},
  "Prompt-pKfl9": {},
  "ChatOutput-WcGpD": {},
  "OpenAIModel-5UyvQ": {}
}}'
```

The flow ID in this example is `fff8dcaa-f0f6-4136-9df0-b7cb38de42e0`, a UUID generated by Langflow and used in the endpoint URL.
See [API](/configuration-api-keys) to change the endpoint.

3. To stop Langflow, press **Ctrl+C**.

### Start Langflow in backend-only mode

1. Start Langflow in backend-only mode.

```python
python3 -m langflow run --backend-only
```

The terminal prints `Welcome to ⛓ Langflow`.
Langflow is now serving requests to its API.

2. Run the curl code you copied from the UI.
You should get a result like this:

```shell
{"session_id":"ef7e0554-69e5-4e3e-ab29-ee83bcd8d9ef:bf81d898868ac87e1b4edbd96c131c5dee801ea2971122cc91352d144a45b880","outputs":[{"inputs":{"input_value":"hi, are you there?"},"outputs":[{"results":{"result":"Arrr, ahoy matey! Aye, I be here. What be ye needin', me hearty?"},"artifacts":{"message":"Arrr, ahoy matey! Aye, I be here. What be ye needin', me hearty?","sender":"Machine","sender_name":"AI"},"messages":[{"message":"Arrr, ahoy matey! Aye, I be here. What be ye needin', me hearty?","sender":"Machine","sender_name":"AI","component_id":"ChatOutput-ktwdw"}],"component_display_name":"Chat Output","component_id":"ChatOutput-ktwdw","used_frozen_result":false}]}]}%
```

This confirms Langflow is receiving your POST request, running the flow, and returning the result without running the frontend.

You can interact with this endpoint using the other options in the **API** menu, including the Python and Javascript APIs.

### Query the Langflow endpoint with a Python script

Using the same flow ID, run a Python sample script to send a query and get a prettified JSON response back.

1. Create a Python file and name it `langflow_api_demo.py`.

```python
import requests
import json

def query_langflow(message):
    url = "http://127.0.0.1:7861/api/v1/run/fff8dcaa-f0f6-4136-9df0-b7cb38de42e0"
    headers = {"Content-Type": "application/json"}
    data = {"input_value": message}

    response = requests.post(url, headers=headers, json=data)
    return response.json()

user_input = input("Enter your message: ")
result = query_langflow(user_input)

print(json.dumps(result, indent=2))
```
2. Run the script.

```python
python langflow_api_demo.py
```

3. Enter your message when prompted.
You will get a prettified JSON response back containing a response to your message.

### Configure host and ports in backend-only mode

To change the host and port, pass the values as additional flags.

```python
python -m langflow run --host 127.0.0.1 --port 7860 --backend-only
```




