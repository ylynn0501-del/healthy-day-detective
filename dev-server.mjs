import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png'};
const port=Number(process.env.PORT||4175);
createServer(async(req,res)=>{try{const raw=req.url==='/'?'index.html':req.url.slice(1).split('?')[0];const path=normalize(raw);if(path.startsWith('..'))throw new Error();const data=await readFile(join(process.cwd(),path));res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));

