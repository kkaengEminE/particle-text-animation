export const SHAPE_NAMES = ['circle', 'star', 'diamond'];

export function drawParticle(ctx, particle) {
  ctx.globalAlpha = particle.opacity;
  ctx.fillStyle = particle.color;

  const shape = particle.shape === 'random'
    ? SHAPE_NAMES[particle.shapeIndex]
    : particle.shape;

  switch (shape) {
    case 'star':
      drawStar(ctx, particle.x, particle.y, particle.size);
      break;
    case 'diamond':
      drawDiamond(ctx, particle.x, particle.y, particle.size);
      break;
    case 'circle':
    default:
      drawCircle(ctx, particle.x, particle.y, particle.size);
      break;
  }

  ctx.globalAlpha = 1;
}

function drawCircle(ctx, x, y, size) {
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
}

function drawStar(ctx, x, y, size) {
  const spikes = 5;
  const outerRadius = size;
  const innerRadius = size * 0.4;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI / spikes) * i - Math.PI / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawDiamond(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.7, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * 0.7, y);
  ctx.closePath();
  ctx.fill();
}
