/* Póster promocional local: usa la foto real, no altera la apariencia del producto. */
const temas: Record<string, [string, string, string]> = {
  "Perfumes": ["#fff1f4", "#f2bacf", "#7e2d55"],
  "Belleza": ["#fff0f6", "#f8b6d7", "#a22263"],
  "Calzado": ["#ecf5ff", "#aac5f8", "#174187"],
  "Bolsas y Carteras": ["#fbf2e8", "#dbb9a0", "#67442e"],
  "Accesorios": ["#f9edff", "#d9b3fb", "#743fa6"],
  "Ropa": ["#fff5ef", "#f2cbb8", "#914959"],
  "Artículos para Caballero": ["#e9eef5", "#9baec1", "#25384c"],
};
function cuadro(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath(); c.moveTo(x + r, y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r);
  c.lineTo(x+w,y+h-r); c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  c.lineTo(x+r,y+h); c.quadraticCurveTo(x,y+h,x,y+h-r);
  c.lineTo(x,y+r); c.quadraticCurveTo(x,y,x+r,y); c.closePath();
}
async function cargarFoto(archivo: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(archivo);
  try {
    const img = new Image();
    await new Promise<void>((resolve,reject)=>{
      img.onload=()=>resolve(); img.onerror=()=>reject(new Error("No se pudo abrir la fotografía."));
      img.src=url;
    });
    return img;
  } finally { URL.revokeObjectURL(url); }
}
function linea(c: CanvasRenderingContext2D, texto: string, maxAncho: number, maxLineas: number) {
  const palabras=texto.split(/\s+/).filter(Boolean);
  const lineas:string[]=[]; let actual="";
  for(const palabra of palabras){
    const prueba=actual ? actual+" "+palabra : palabra;
    if(c.measureText(prueba).width>maxAncho && actual){lineas.push(actual);actual=palabra;}
    else actual=prueba;
  }
  if(actual)lineas.push(actual);
  if(lineas.length>maxLineas){
    lineas.length=maxLineas;
    while(lineas[maxLineas-1].length>2 && c.measureText(lineas[maxLineas-1]+"…").width>maxAncho)
      lineas[maxLineas-1]=lineas[maxLineas-1].slice(0,-1);
    lineas[maxLineas-1]+="…";
  }
  return lineas;
}
export async function crearPosterJudi(foto: File, nombre: string, categoria: string, precio: number): Promise<File> {
  const canvas=document.createElement("canvas");
  canvas.width=1080;canvas.height=1350;
  const c=canvas.getContext("2d");
  if(!c)throw new Error("No se pudo iniciar el generador de pósteres.");
  const [fondo,luz,tinta]=temas[categoria]||["#f7f3fa","#d5c6e7","#59416b"];
  const bg=c.createLinearGradient(0,0,1000,1350);bg.addColorStop(0,fondo);bg.addColorStop(1,luz);
  c.fillStyle=bg;c.fillRect(0,0,1080,1350);
  c.globalAlpha=.24;c.fillStyle="#ffffff";
  for(const [x,y,r] of [[85,180,175],[995,365,215],[122,1090,245],[940,1200,160]]){
    c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
  }
  c.globalAlpha=1;
  c.fillStyle=tinta;c.textAlign="center";c.font="italic 700 57px Georgia,serif";
  c.fillText("Judi’s Shop",540,90);
  c.fillStyle=tinta;c.font="700 65px Arial,sans-serif";
  let lineas:string[]=[];
  for(let tam=65;tam>=40;tam-=5){
    c.font="700 "+tam+"px Arial,sans-serif";
    lineas=linea(c,nombre,940,2);
    if(lineas.join(" ").replace(/…/g,"").length>=nombre.trim().length-2 || tam===40)break;
  }
  lineas.forEach((l,i)=>c.fillText(l,540,178+i*77));
  c.font="600 26px Arial,sans-serif";c.globalAlpha=.85;
  c.fillText(categoria.toLocaleUpperCase("es"),540,330);
  c.globalAlpha=1;

  c.shadowColor="rgba(47,28,53,.16)";c.shadowBlur=35;c.shadowOffsetY=19;
  cuadro(c,95,385,890,715,46);c.fillStyle="#ffffff";c.fill();
  c.shadowColor="transparent";c.shadowBlur=0;c.shadowOffsetY=0;
  const img=await cargarFoto(foto);
  const ajuste=Math.min(810/img.naturalWidth,640/img.naturalHeight);
  const w=img.naturalWidth*ajuste,h=img.naturalHeight*ajuste;
  c.save();cuadro(c,122,405,836,675,30);c.clip();
  c.drawImage(img,540-w/2,742-h/2,w,h);
  c.restore();
  c.fillStyle=tinta;cuadro(c,240,1135,600,109,40);c.fill();
  c.textAlign="center";c.fillStyle="#ffffff";c.font="700 68px Arial,sans-serif";
  c.fillText(new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"}).format(precio),540,1210);
  c.fillStyle=tinta;c.font="600 24px Arial,sans-serif";
  c.fillText("DISPONIBLE EN JUDI’S SHOP",540,1305);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob((b)=>b?resolve(b):reject(new Error("No se pudo exportar el póster.")),"image/jpeg",.88));
  return new File([blob],"poster-judis-"+Date.now()+".jpg",{type:"image/jpeg"});
}
