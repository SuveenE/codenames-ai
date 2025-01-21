# Codenames AI

### I got OpenAI o1 to play Codenames and it's super good.

You can get AI to play your own games at [codenames.suveenellawela.com](https://codenames.suveenellawela.com)

Here's a short [blog post](https://suveenellawela.com/thoughts/codenames-ai) I published with my findings.

New to Codenames? Here's a 3-minute [video](https://www.youtube.com/watch?v=WErB95Brgbs) explaining how it works.

<img width="757" alt="Screenshot 2025-01-01 at 20 40 27" src="https://github.com/user-attachments/assets/a886353d-0b54-41a5-9681-9afaf5de3972" />

## Features

- See AI play a game with random words
- See AI play a game with a custom set of words and a custom board (If you just finished playing a game, see how AI would have played it)
- Replay previous games ( Currently this is suppored only for a test game )
- Add your own API key to use OpenAI models

Custom Game input:
<img width="757" alt="Screenshot 2025-01-01 at 20 40 27" src="https://github.com/user-attachments/assets/9c60b324-c29b-4608-a5ba-da0664b20564" />

## The story behind

During our lunch breaks, my colleagues and I have been enjoying games of Codenames. In one round, the clue giver faced the challenge of connecting "carrot" and "ray." At the end of the game, I asked ChatGPT for a suggestion, and it came up with "Orange", a pretty clever clue! My own idea was "Laser."

That got me thinking: how good could AI be at playing Codenames? So, I built this.

## Getting Started

First, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Links

- [Codenames Website](https://www.codenamesgame.com/)
- [How to play](https://czechgames.com/files/rules/codenames-rules-en.pdf)
- [Words used in the game](https://github.com/jacksun007/codenames/blob/main/codenames.txt)
