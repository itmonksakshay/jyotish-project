/**
 * Lightweight 4x4 Matrix Mathematics Library for WebGL projections.
 * All matrices are represented as 16-element flat arrays in column-major order,
 * which is the standard format required by WebGL shaders.
 */

export type Vec3 = [number, number, number];
export type Mat4 = Float32Array;

export const createIdentity = (): Mat4 => {
  const m = new Float32Array(16);
  m[0] = 1;  m[4] = 0;  m[8] = 0;  m[12] = 0;
  m[1] = 0;  m[5] = 1;  m[9] = 0;  m[13] = 0;
  m[2] = 0;  m[6] = 0;  m[10] = 1; m[14] = 0;
  m[3] = 0;  m[7] = 0;  m[11] = 0; m[15] = 1;
  return m;
};

export const multiply = (a: Mat4, b: Mat4): Mat4 => {
  const out = new Float32Array(16);
  const a00 = a[0],  a01 = a[1],  a02 = a[2],  a03 = a[3];
  const a10 = a[4],  a11 = a[5],  a12 = a[6],  a13 = a[7];
  const a20 = a[8],  a21 = a[9],  a22 = a[10], a23 = a[11];
  const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

  let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
  out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
  out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
  out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
  out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

  b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
  out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
  out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
  out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
  out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

  b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
  out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
  out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
  out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
  out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

  b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
  out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
  out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
  out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
  out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

  return out;
};

export const createPerspective = (fovRad: number, aspect: number, near: number, far: number): Mat4 => {
  const m = new Float32Array(16);
  const f = 1.0 / Math.tan(fovRad / 2);
  const nf = 1.0 / (near - far);

  m[0] = f / aspect;
  m[5] = f;
  m[10] = (far + near) * nf;
  m[11] = -1;
  m[14] = 2 * far * near * nf;

  return m;
};

export const createLookAt = (eye: Vec3, center: Vec3, up: Vec3): Mat4 => {
  const m = new Float32Array(16);
  const [eyex, eyey, eyez] = eye;
  const [upx, upy, upz] = up;
  const [centx, centy, centz] = center;

  // Compute forward vector (z-axis)
  let z0 = eyex - centx;
  let z1 = eyey - centy;
  let z2 = eyez - centz;
  // Normalize forward vector
  let len = Math.sqrt(z0*z0 + z1*z1 + z2*z2);
  if (len > 0) {
    len = 1 / len;
    z0 *= len; z1 *= len; z2 *= len;
  }

  // Compute right vector (x-axis) = up cross z
  let x0 = upy * z2 - upz * z1;
  let x1 = upz * z0 - upx * z2;
  let x2 = upx * z1 - upy * z0;
  // Normalize right vector
  len = Math.sqrt(x0*x0 + x1*x1 + x2*x2);
  if (len > 0) {
    len = 1 / len;
    x0 *= len; x1 *= len; x2 *= len;
  }

  // Compute up vector (y-axis) = z cross x
  let y0 = z1 * x2 - z2 * x1;
  let y1 = z2 * x0 - z0 * x2;
  let y2 = z0 * x1 - z1 * x0;
  // Normalize up vector
  len = Math.sqrt(y0*y0 + y1*y1 + y2*y2);
  if (len > 0) {
    len = 1 / len;
    y0 *= len; y1 *= len; y2 *= len;
  }

  m[0] = x0;  m[4] = x1;  m[8] = x2;   m[12] = -(x0*eyex + x1*eyey + x2*eyez);
  m[1] = y0;  m[5] = y1;  m[9] = y2;   m[13] = -(y0*eyex + y1*eyey + y2*eyez);
  m[2] = z0;  m[6] = z1;  m[10] = z2;  m[14] = -(z0*eyex + z1*eyey + z2*eyez);
  m[3] = 0;   m[7] = 0;   m[11] = 0;   m[15] = 1;

  return m;
};

export const rotateY = (m: Mat4, angleRad: number): Mat4 => {
  const out = new Float32Array(m);
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);

  const m00 = m[0], m01 = m[1], m02 = m[2], m03 = m[3];
  const m20 = m[8], m21 = m[9], m22 = m[10], m23 = m[11];

  out[0] = m00 * c - m20 * s;
  out[1] = m01 * c - m21 * s;
  out[2] = m02 * c - m22 * s;
  out[3] = m03 * c - m23 * s;

  out[8] = m00 * s + m20 * c;
  out[9] = m01 * s + m21 * c;
  out[10] = m02 * s + m22 * c;
  out[11] = m03 * s + m23 * c;

  return out;
};

export const rotateX = (m: Mat4, angleRad: number): Mat4 => {
  const out = new Float32Array(m);
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);

  const m10 = m[4], m11 = m[5], m12 = m[6], m13 = m[7];
  const m20 = m[8], m21 = m[9], m22 = m[10], m23 = m[11];

  out[4] = m10 * c + m20 * s;
  out[5] = m11 * c + m21 * s;
  out[6] = m12 * c + m22 * s;
  out[7] = m13 * c + m23 * s;

  out[8] = -m10 * s + m20 * c;
  out[9] = -m11 * s + m21 * c;
  out[10] = -m12 * s + m22 * c;
  out[11] = -m13 * s + m23 * c;

  return out;
};
