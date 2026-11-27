const results: string[] = [];
function sniff(b: Uint8Array) {
  const s = (o: number, n: number) => String.fromCharCode(...b.slice(o, o + n));
  if (b[0] === 0xff && b[1] === 0xd8) return "JPEG";
  if (s(1, 3) === "PNG") return "PNG";
  if (s(0, 4) === "RIFF" && s(8, 4) === "WEBP") return "WEBP";
  if (s(0, 4) === "%PDF") return "PDF";
  if (s(4, 4) === "ftyp") return "HEIF/" + s(8, 4);
  return "unknown";
}
const page = `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><body style="font:18px sans-serif;padding:16px">
<h3>007 photo-format test</h3><p>Take or pick the SAME default-camera photo in each box. Results appear below.</p>
${["image/jpeg,image/png,image/webp,application/pdf", "image/*,application/pdf", "image/jpeg,image/png,image/webp"].map((a, i) => `<p><b>Box ${i + 1}</b> accept="${a}"<br><input type=file accept="${a}" onchange="up(this,${i + 1})"></p>`).join("")}
<pre id=o></pre><script>
async function up(el,box){const f=el.files[0];if(!f)return;const r=await fetch(location.pathname+"/up?box="+box+"&name="+encodeURIComponent(f.name)+"&type="+encodeURIComponent(f.type),{method:"POST",body:f});document.getElementById("o").textContent=await r.text();}
</script>`;
Deno.serve(async (req) => {
  const u = new URL(req.url);
  if (u.pathname.endsWith("/up")) {
    const b = new Uint8Array(await req.arrayBuffer());
    results.push(`box${u.searchParams.get("box")}: name=${u.searchParams.get("name")} declared=${u.searchParams.get("type")} sniffed=${sniff(b)} bytes=${b.length}`);
    console.log("RESULT", results.at(-1));
    return new Response(results.join("\n"));
  }
  return new Response(page, { headers: { "content-type": "text/html; charset=utf-8" } });
});
