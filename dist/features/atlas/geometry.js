/** Geometry uses normalized percentages; there is no dependency on the DOM. */
export function polygonArea(points) {
  return Math.abs(points.reduce((sum,a,i)=>{const b=points[(i+1)%points.length];return sum+a[0]*b[1]-b[0]*a[1];},0))/2;
}
function cross(a,b,c) {return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);}
function onSegment(p,a,b) {
  return Math.abs(cross(a,b,p))<1e-7 && p[0]>=Math.min(a[0],b[0])-1e-7 && p[0]<=Math.max(a[0],b[0])+1e-7 && p[1]>=Math.min(a[1],b[1])-1e-7 && p[1]<=Math.max(a[1],b[1])+1e-7;
}
export function pointInPolygon(point,points) {
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++) {
    const a=points[j],b=points[i];
    if(onSegment(point,a,b))return true;
    if((a[1]>point[1])!==(b[1]>point[1]) && point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}
function intersects(a,b,c,d) {
  const ab1=cross(a,b,c),ab2=cross(a,b,d),cd1=cross(c,d,a),cd2=cross(c,d,b);
  return (ab1*ab2<0 && cd1*cd2<0) || onSegment(c,a,b)||onSegment(d,a,b)||onSegment(a,c,d)||onSegment(b,c,d);
}
export function validPolygon(points) {
  if(!Array.isArray(points)||points.length<3||points.length>80)return false;
  if(!points.every(p=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isFinite(v)&&v>=0&&v<=100)))return false;
  if(polygonArea(points)<0.02)return false;
  for(let i=0;i<points.length;i++) {
    const next=(i+1)%points.length;
    if(points[i][0]===points[next][0]&&points[i][1]===points[next][1])return false;
    for(let j=i+1;j<points.length;j++) {
      if(j===next||(j+1)%points.length===i)continue;
      if(intersects(points[i],points[next],points[j],points[(j+1)%points.length]))return false;
    }
  }
  return true;
}
export function polygonAnchor(points) {
  const average=points.reduce((p,q)=>[p[0]+q[0]/points.length,p[1]+q[1]/points.length],[0,0]);
  if(pointInPolygon(average,points))return {x:average[0],y:average[1]};
  // An anchor on the first edge is valid for strongly concave regions as well.
  return {x:(points[0][0]+points[1][0])/2,y:(points[0][1]+points[1][1])/2};
}
