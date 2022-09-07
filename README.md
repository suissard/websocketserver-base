# WEBSOCKETSERVER-BASE

WebSocket system, to connect users and allow them to tchating and handle/share private data. The instanciation can be fill with other handlers

## DATA SYSTEM

The access to data {ManageableObject} is determined by owner, token, users and visibility

- owner : can do everything
- token : can do everything except delete, change owner, change id
- users : can add users but not delete them or update data
- visibility : if it true, everyone can see id, number of users

Each Class who herite from ManageableObject can customise access to spécifique property or actions

## EVENTS

### login:
- ServerSide => check if the user is new or create one
- ClientSide => get complete userData

### logout:
- ServerSide => emit the event to the user who can see the user who logout
- ClientSide => get the id of the user who logout

### disconnect:
- ServerSide => same as logout
- ClientSide => same as logout

### connect_lobby:
- ServerSide => check if lobby exist, if not create one. If lobby exist, check if user can connect.Emit to the user of the lobby
- ClientSide => get the user id and the lobby id

### disconnect_lobby:
- ServerSide => check if user is present and delete it from the lobby. Emit to the user of the lobby
- ClientSide => get the user id and the lobby id

### send_message:
- ServerSide => create a message in the lobby. Emit event to the user of the lobby
- ClientSide => get messageData

### received_message:
- ServerSide => Emit event to the user of the lobby
- ClientSide => get user id, lobby id and message id

### viewed_message:
- ServerSide => Emit event to the user of the lobby
- ClientSide => get user id, lobby id and message id

### typing_message:
- ServerSide => Emit event to the user of the lobby
- ClientSide => get user id, lobby id and message id

### get_data:
- ServerSide => check access and emit info graduate to the access
- ClientSide => get data

### get_all_data:
- ServerSide => check access and emit all info graduate to the access
- ClientSide => get all data

### update_data:
- ServerSide => Update data and send to the users
- ClientSide => get the updated data and the id


```js
if ()
```

[GitHub repository](https://github.com/suissard/websocketserver-base)
