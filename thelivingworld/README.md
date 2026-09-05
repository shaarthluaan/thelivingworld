# The Living World

Jogo visual offline para transmissões: uma ilha flutuante cuja civilização evolui através de eventos. Esta primeira fase usa somente o `MockEventProvider`, claramente limitado ao ambiente de testes; não há conexão com TikTok nem backend.

## Executar

Instale Node.js e, no diretório do projeto, execute `npm test` para validar. Para abrir o jogo, use `npx serve .` (ou qualquer servidor estático) e acesse o endereço exibido. O jogo também é um site estático: os módulos exigem um servidor local moderno, não um arquivo aberto via `file://`.

Pressione **F2** para abrir o painel de desenvolvimento. Ele simula joins, follows, likes, comandos, cinco tiers de presentes, streaks, eventos globais, carga e persistência. O estado fica em `localStorage`; há cópia de segurança e recuperação segura quando o JSON salvo é inválido.

## Arquitetura

- `src/game`: estado e regras puras do jogo.
- `src/events`: validação de dados não confiáveis e provedor mock.
- `src/core`: EventBus, logs e deduplicação idempotente.
- `src/systems`: temporada, máquina de estados de eventos globais e áudio Web Audio opcional.
- `src/render`: desenho Canvas 2D; `src/ui`: HUD e painel, sem criação de elementos por evento.
- `src/storage`: persistência local com backup.

Os limites de eras, presentes por tier, títulos, agregação de likes e memória de IDs estão centralizados em `src/config/gameConfig.js`.

## TikTok LIVE (ponte local)

O jogo continua sendo um site estático e não importa a biblioteca TikTok. A ponte Node em `../TiktokLive_Conector/TikTok-Live-Connector-ts-rewrite` normaliza os eventos do SDK e os envia por WebSocket local; `TikTokEventProvider` os coloca em fila e os libera em lotes para o `EventBus` no próximo frame.

1. No diretório do conector, execute `npm install`, `npm run build` e `npm run game:bridge -- @seu_usuario`.
2. No diretório deste jogo, execute `npm run serve` e abra o endereço exibido. O painel indica `TikTok: CONNECTED` quando a ponte e a LIVE estiverem conectadas.

O bridge reconecta com backoff exponencial (1–60 segundos), não cria conexões TikTok simultâneas e encerra a conexão de forma limpa com Ctrl+C. Eventos suportados: join, follow, like (agregado pelo contador real), comentário, gift/streak, share, conectou, desconectou e erro. CONNECT/DISCONNECT/ERROR atualizam o status; somente eventos de gameplay entram na fila. Sem bridge ou LIVE, o jogo continua normalmente e o F2 mantém o modo `MockEventProvider`.

## Limitações reais

Os sons são bipes curtos gerados localmente pelo Web Audio API, não música ambiente. A renderização é uma arte Canvas procedural, sem assets raster externos. Eventos de chuva possuem máquina de estados disponível, mas o painel expõe os eventos solicitados explicitamente.
