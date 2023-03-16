# Online Soundboard Client

## Usage
```sh
pnpm add online-soundboard-client
```

```ts
import { Client } from 'online-soundboard-client'

// connect to the server
const client = new Client(serverUrl)

// cache a sound
client.cache(sound)

// play a sound
client.play(soundId)

// update data
client.updateSound(soundData)
client.updateBoard(boardData)
client.data = { name: 'client' }

// cached sounds list
client.sounds

// some events
client.on('connect', callback)
client.on('sound:play', callback)
client.on('client:join', callback)
client.on('client:leave', callback)
```

## Development
```sh
pnpm install

pnpm run build:prod #prod
```
