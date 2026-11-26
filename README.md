# news-image-20261126

[![make.fun · news-image-20261126](https://make.fun/badge/news-image-20261126.svg)](https://make.fun/bounty/news-image-20261126?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261126)
[![rank](https://make.fun/badge/news-image-20261126/davlermid/news-image-20261126/rank.svg)](https://make.fun/bounty/news-image-20261126/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261126)
[![reward](https://make.fun/badge/news-image-20261126/davlermid/news-image-20261126/reward.svg)](https://make.fun/bounty/news-image-20261126?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261126)

## World News — 26 November 2026

A one-picture front page of the world on Thursday, 26 November 2026:
**35 dated stories, 7 regions** — a fuel tanker fire kills 31 on Cairo's
ring road, Kyiv hits five Russian jets and two refineries, and China flies
its first foreign astronaut to Tiangong.

The poster (`entry.png`, 1024×1024, under 1 MiB) is drawn from
`stories.json` — 13 illustrated cards (the 3 biggest stories lead),
a numbered world map, 22 more stories, a 6-number key strip, and a
DATE CHECK box naming the 24 November stories that were dropped.
Every story was reported on 26 November 2026; the source is named
per story.

## Run it

```sh
MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts
```

The poster was rendered from the day's `stories.json` with
`generate.py` (kept in the sibling `news-image-20261126-src` folder).

`main.ts` (Node 22, no dependencies) validates the PNG — signature,
chunk structure, 1024×1024 dimensions, size under 1 MiB — then copies
it unchanged to the output directory and reads it back to prove the
copy is identical. Running it twice writes the same bytes.

## Sources

AP, Reuters, BBC, ESA, USGS, Sky News, Chess.com, UN, PTI, BCCI,
Investopedia, The Times, Women's Aid — named per story on the poster.
