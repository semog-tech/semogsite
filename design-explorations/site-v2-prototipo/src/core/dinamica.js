/* Gradiente Dinâmica vivo (WebGL puro): mesh difuso do rebrand, branco dominante,
   manchas azul-claro, véu lavanda e, opcional, uma mancha marinho suave. Distorcido por
   ruído para não virar "mancha redonda"; respira devagar; leva grão no próprio shader.
   As cores vêm dos tokens do :root. O fundo CSS (--grad-dinamica) fica por baixo como
   reserva: quem usa deve tratar o erro de criarDinamica e manter o CSS. */
import { corDoToken } from "./cores.js";

const FRAG = `precision highp float;
  uniform vec2 uRes; uniform float uTempo; uniform vec2 uEsc; uniform float uEscuro;
  uniform vec3 uBranco; uniform vec3 uCeu; uniform vec3 uNevoa; uniform vec3 uLavanda; uniform vec3 uMarinho;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float ruido(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * ruido(p); p = p * 2.03 + 1.7; a *= 0.5; }
    return v;
  }
  float mancha(vec2 p, vec2 c, vec2 r) { vec2 d = (p - c) / r; return exp(-dot(d, d)); }
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    float a = uRes.x / uRes.y;
    float t = uTempo;
    vec2 p = vec2(uv.x * a, uv.y);
    vec2 q = vec2(fbm(p * 1.2 + vec2(0.0, t * 0.035)), fbm(p * 1.2 + vec2(5.2, -t * 0.03)));
    vec2 r = p + (q - 0.5) * 0.75;
    vec3 c = uBranco;
    c = mix(c, uCeu, 0.9 * mancha(r, vec2(a * (0.1 + 0.05 * sin(t * 0.05)), 0.08 + 0.05 * cos(t * 0.04)), vec2(0.55 * a, 0.5)));
    c = mix(c, uCeu, 0.6 * mancha(r, vec2(a * (0.9 + 0.04 * cos(t * 0.06)), 0.92), vec2(0.45, 0.38)));
    c = mix(c, uLavanda, 0.6 * mancha(r, vec2(a * 0.55, 0.85 + 0.04 * sin(t * 0.05)), vec2(0.6, 0.3)));
    c = mix(c, uNevoa, 0.3 * mancha(r, vec2(a * uEsc.x - 0.12, uEsc.y + 0.16), vec2(0.62, 0.48)));
    c = mix(c, uMarinho, uEscuro * mancha(r, vec2(a * uEsc.x + 0.05 * sin(t * 0.07), uEsc.y + 0.04 * cos(t * 0.05)), vec2(0.34, 0.27)));
    c = mix(c, uBranco, 0.55 * mancha(r, vec2(a * 0.3, 0.55), vec2(0.65, 0.42)));
    c += (hash(gl_FragCoord.xy + fract(t)) - 0.5) / 255.0;
    gl_FragColor = vec4(c, 1.0);
  }`;
const VERT = `attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

/** @param {WebGLRenderingContext} gl @param {number} tipo @param {string} fonte */
function compilar(gl, tipo, fonte) {
  const shader = gl.createShader(tipo);
  if (!shader) throw new Error("Shader não foi criado.");
  gl.shaderSource(shader, fonte);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`Shader não compilou: ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
}

/** @param {WebGLRenderingContext} gl */
function ligarPrograma(gl) {
  const programa = gl.createProgram();
  if (!programa) throw new Error("Programa WebGL não foi criado.");
  gl.attachShader(programa, compilar(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(programa, compilar(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(programa);
  if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) {
    throw new Error("Programa Dinâmica não ligou.");
  }
  gl.useProgram(programa);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(programa, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  return programa;
}

/** @param {WebGLRenderingContext} gl @param {(nome: string) => WebGLUniformLocation | null} u */
function passarCores(gl, u) {
  const pares = [
    ["uBranco", "--branco"],
    ["uCeu", "--ceu"],
    ["uNevoa", "--nevoa"],
    ["uLavanda", "--lavanda"],
    ["uMarinho", "--marinho"],
  ];
  for (const [uniforme, token] of pares) {
    const [r, g, b] = corDoToken(token);
    gl.uniform3f(u(uniforme), r / 255, g / 255, b / 255);
  }
}

/**
 * @typedef {Object} OpcoesDinamica
 * @property {[number, number]} [esc] Centro da mancha escura (0–1). Padrão [0.75, 0.3].
 * @property {number} [escuro] Força da mancha marinho (0 = nenhuma). Padrão 0.
 * @property {() => void} [aoFalhar] Contexto WebGL perdido: volte ao fundo CSS.
 */

/**
 * Cria o gradiente num canvas. Lança erro se não houver WebGL (Firefox headless pode vir
 * sem): trate e mantenha o --grad-dinamica do CSS. Pinte o primeiro quadro já ao criar,
 * senão o canvas aparece vazio. Desenhe pelo util.lacoVisivel (ticker, só visível).
 * @param {HTMLCanvasElement} canvas
 * @param {OpcoesDinamica} [opcoes]
 * @returns {{ redimensionar: () => void, desenhar: (tempo: number) => void }}
 */
export function criarDinamica(canvas, opcoes = {}) {
  const { esc = [0.75, 0.3], escuro = 0, aoFalhar } = opcoes;
  // alpha: true para que um quadro ainda não pintado mostre o fundo CSS de reserva, não preto.
  const gl = canvas.getContext("webgl", {
    antialias: false,
    alpha: true,
    depth: false,
    powerPreference: "low-power",
  });
  if (!gl) throw new Error("WebGL indisponível para o gradiente Dinâmica.");
  const programa = ligarPrograma(gl);
  const u = (nome) => gl.getUniformLocation(programa, nome);
  passarCores(gl, u);
  gl.uniform2f(u("uEsc"), esc[0], esc[1]);
  gl.uniform1f(u("uEscuro"), escuro);
  canvas.addEventListener(
    "webglcontextlost",
    (evento) => {
      evento.preventDefault();
      // Aviso, não erro: a cena degrada para o gradiente CSS sem quebrar.
      console.warn("[dinâmica] contexto WebGL perdido; segue o fundo CSS.");
      aoFalhar?.();
    },
    { once: true },
  );
  return {
    // Campo suave: meia resolução basta e poupa GPU.
    redimensionar() {
      const caixa = canvas.getBoundingClientRect();
      const w = Math.max(2, Math.round(caixa.width * 0.5));
      const h = Math.max(2, Math.round(caixa.height * 0.5));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u("uRes"), w, h);
    },
    desenhar(tempo) {
      gl.uniform1f(u("uTempo"), tempo);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
