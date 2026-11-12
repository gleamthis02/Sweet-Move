// ============================================================================
//  poses.js  —  คลังท่าทางทั้งหมด 25 ท่า + ตัวติดตามสถานะ (PoseTracker)
//  ใช้ร่วมกับ MediaPipe Pose Landmarker (33 จุด)
//
//  โครงสร้างของแต่ละท่า:
//    no       เลขท่าตามไฟล์ "ท่าทางทั้งหมด.md"
//    id       ชื่อ id สำหรับอ้างอิงในโค้ด
//    name     ชื่อท่า (ไทย)
//    seated   true = นั่งเล่นได้
//    jump     true = ต้องกระโดด
//    level    "ง่าย" | "กลาง" | "ยาก"
//    desc     คำอธิบายเงื่อนไขสั้นๆ
//    phases   รายการสถานะของท่านั้น (ตัวแรก = สถานะเริ่มต้น)
//    need     index ของ landmark ที่ต้องมองเห็น
//    detect   (c, mem) => ชื่อ phase | null   (null = ท่าอยู่ช่วงกลาง ไม่เปลี่ยนสถานะ)
//
//  นิยามทิศ: "ซ้าย/ขวา" = ซ้าย/ขวาของ "ตัวผู้เล่นเอง" (ตรงกับภาพกระจกบนหน้าจอ)
//  1 ครั้ง (rep) = วนครบทุก phase แล้วกลับมาที่ phase แรก
// ============================================================================

// ---------- ตำแหน่ง landmark ของ MediaPipe ----------
export const LM = {
  NOSE: 0, L_EAR: 7, R_EAR: 8,
  L_SHOULDER: 11, R_SHOULDER: 12, L_ELBOW: 13, R_ELBOW: 14, L_WRIST: 15, R_WRIST: 16,
  L_HIP: 23, R_HIP: 24, L_KNEE: 25, R_KNEE: 26, L_ANKLE: 27, R_ANKLE: 28,
};
const { NOSE, L_EAR, R_EAR, L_SHOULDER: LS, R_SHOULDER: RS, L_ELBOW: LE, R_ELBOW: RE,
        L_WRIST: LW, R_WRIST: RW, L_HIP: LH, R_HIP: RH, L_KNEE: LK, R_KNEE: RK,
        L_ANKLE: LA, R_ANKLE: RA } = LM;

// ---------- ฟังก์ชันช่วยคำนวณ ----------
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/** มุมที่จุด b (องศา) */
export function angle(a, b, c) {
  const r = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  const d = Math.abs(r * 180 / Math.PI);
  return d > 180 ? 360 - d : d;
}

/** ค่าอ้างอิงที่ปรับตัวช้าๆ (ใช้กับท่าที่ต้องเทียบกับท่าปกติของผู้เล่น) */
function ref(mem, key, value, mode) {
  if (mem[key] === undefined) mem[key] = value;
  else if ((mode === "max" && value > mem[key]) || (mode === "min" && value < mem[key])) mem[key] = value;
  else mem[key] += (value - mem[key]) * 0.001;
  return mem[key];
}

/**
 * สร้าง context ที่ detector ใช้ — พิกัด x ถูกคูณ aspect ratio แล้ว
 * เพื่อให้ระยะทาง/มุมในแกน x และ y มีสเกลเท่ากัน
 * หน่วยวัดหลัก: sw = ความกว้างไหล่, torso = ความยาวลำตัว (ไหล่→สะโพก)
 */
function buildContext(raw, aspect) {
  const p = raw.map(q => ({ x: q.x * aspect, y: q.y, z: q.z, visibility: q.visibility }));
  const midSh = mid(p[LS], p[RS]);
  const midHip = mid(p[LH], p[RH]);
  return {
    p, nose: p[NOSE], lear: p[L_EAR], rear: p[R_EAR],
    ls: p[LS], rs: p[RS], le: p[LE], re: p[RE], lw: p[LW], rw: p[RW],
    lh: p[LH], rh: p[RH], lk: p[LK], rk: p[RK], la: p[LA], ra: p[RA],
    midSh, midHip,
    sw: dist(p[LS], p[RS]),
    torso: dist(midSh, midHip),
    elbowL: angle(p[LS], p[LE], p[LW]),
    elbowR: angle(p[RS], p[RE], p[RW]),
  };
}

// ---------- ตัวตรวจที่ใช้ร่วมกันหลายท่า ----------
function crossShoulderTouch(c) {            // ท่า 8 และ 16
  const r = 0.5 * c.sw;
  if (dist(c.rw, c.ls) < r) return "LEFT";   // มือขวาแตะไหล่ซ้าย
  if (dist(c.lw, c.rs) < r) return "RIGHT";  // มือซ้ายแตะไหล่ขวา
  return null;
}

function kneeLift(c) {                       // ท่า 12 และ 25
  if (c.lk.y < c.lh.y + 0.35 * c.torso || c.rk.y < c.rh.y + 0.35 * c.torso) return "UP";
  if (c.lk.y > c.lh.y + 0.6 * c.torso && c.rk.y > c.rh.y + 0.6 * c.torso) return "DOWN";
  return null;
}

// ============================================================================
//  รายการท่าทาง
// ============================================================================
export const POSES = [

  // ===== 01 ชูมือสองข้างเหนือหัว-ลง =====
  {
    no: 1, id: "hands-up-down", name: "ชูมือสองข้างเหนือหัว-ลง", seated: true, level: "ง่าย",
    desc: "UP: ข้อมือสองข้างสูงกว่าจมูก | DOWN: ข้อมือสองข้างต่ำกว่าไหล่",
    phases: ["DOWN", "UP"], need: [NOSE, LS, RS, LW, RW],
    detect(c) {
      if (c.lw.y < c.nose.y && c.rw.y < c.nose.y) return "UP";
      if (c.lw.y > c.ls.y && c.rw.y > c.rs.y) return "DOWN";
      return null;
    },
  },

  // ===== 02 ตบมือเหนือหัว =====
  {
    no: 2, id: "clap-overhead", name: "ตบมือเหนือหัว", seated: true, level: "ง่าย",
    desc: "UP: ข้อมืออยู่เหนือจมูกและชิดกัน | DOWN: ข้อมือกางออกข้างตัว ต่ำกว่าไหล่",
    phases: ["DOWN", "UP"], need: [NOSE, LS, RS, LW, RW],
    detect(c) {
      const apart = dist(c.lw, c.rw);
      if (c.lw.y < c.nose.y && c.rw.y < c.nose.y && apart < 0.6 * c.sw) return "UP";
      if (c.lw.y > c.ls.y && c.rw.y > c.rs.y && apart > 0.9 * c.sw) return "DOWN";
      return null;
    },
  },

  // ===== 03 ชูมือสลับซ้าย-ขวา =====
  {
    no: 3, id: "raise-alternate", name: "ชูมือสลับซ้าย-ขวา", seated: true, level: "ง่าย",
    desc: "ซ้าย: ข้อมือซ้ายสูงกว่าไหล่ซ้าย (ขวาต่ำกว่าไหล่) | ขวา: สลับกัน",
    phases: ["LEFT", "RIGHT"], need: [LS, RS, LW, RW],
    detect(c) {
      const left = c.lw.y < c.ls.y && c.rw.y > c.rs.y;
      const right = c.rw.y < c.rs.y && c.lw.y > c.ls.y;
      return left ? "LEFT" : right ? "RIGHT" : null;
    },
  },

  // ===== 04 ชกซ้าย-ขวาไปข้างหน้า =====
  {
    no: 4, id: "punch", name: "ชกซ้าย-ขวาไปข้างหน้า (หมัด)", seated: true, level: "ง่าย",
    desc: "แขนเหยียดตรง (มุมศอกเกิน 150°) และข้อมืออยู่ระดับไหล่ ข้างที่เหยียดคือข้างที่ชก",
    phases: ["LEFT", "RIGHT"], need: [LS, RS, LE, RE, LW, RW],
    detect(c) {
      // กล้องหน้าเห็นความลึกไม่ดี จึงใช้มุมศอก + ข้อมือต้องอยู่ระดับไหล่ (ไม่ใช่ห้อยข้างตัว)
      const level = (w, s) => Math.abs(w.y - s.y) < 0.7 * c.sw;
      const left = c.elbowL > 150 && level(c.lw, c.ls);
      const right = c.elbowR > 150 && level(c.rw, c.rs);
      if (left && !right) return "LEFT";
      if (right && !left) return "RIGHT";
      return null;
    },
  },

  // ===== 05 งอศอก-เหยียดศอก (ยกดัมเบลล์ลม) =====
  {
    no: 5, id: "arm-curl", name: "งอศอก-เหยียดศอก (ยกดัมเบลล์ลม)", seated: true, level: "กลาง",
    desc: "UP: ข้อมือสองข้างใกล้ไหล่ (ศอกงอ) | DOWN: แขนเหยียดตรง",
    phases: ["DOWN", "UP"], need: [LS, RS, LE, RE, LW, RW],
    detect(c) {
      if (dist(c.lw, c.ls) < 0.7 * c.sw && dist(c.rw, c.rs) < 0.7 * c.sw) return "UP";
      if (c.elbowL > 150 && c.elbowR > 150) return "DOWN";
      return null;
    },
  },

  // ===== 06 ดันมือเหนือหัวสลับหน้าอก =====
  {
    no: 6, id: "overhead-press", name: "ยกมือเหนือหัวสลับกับหน้าอก (ดันข้างบน)", seated: true, level: "ง่าย",
    desc: "UP: ข้อมือสูงกว่าจมูกทั้งสองข้าง | DOWN: ข้อมืออยู่ระดับอกและชิดกัน",
    phases: ["DOWN", "UP"], need: [NOSE, LS, RS, LW, RW],
    detect(c) {
      if (c.lw.y < c.nose.y && c.rw.y < c.nose.y) return "UP";
      const atChest = w => w.y > c.ls.y - 0.2 * c.sw && w.y < c.ls.y + 1.3 * c.sw;
      if (atChest(c.lw) && atChest(c.rw) && dist(c.lw, c.rw) < 0.9 * c.sw) return "DOWN";
      return null;
    },
  },

  // ===== 07 โบกมือสองข้างซ้าย-ขวา =====
  {
    no: 7, id: "wave-sideways", name: "โบกมือสองข้างซ้าย-ขวา (ส่ายมือ)", seated: true, level: "ง่าย",
    desc: "ซ้าย: ข้อมือทั้งสองอยู่ซ้ายของแนวกลางลำตัว | ขวา: อยู่ขวาของแนวกลางลำตัว",
    phases: ["LEFT", "RIGHT"], need: [LS, RS, LW, RW],
    detect(c) {
      // ค่าบวก = ไปทางซ้ายของผู้เล่น (x ในภาพดิบมากขึ้น)
      const lat = w => (w.x - c.midSh.x) / c.sw;
      if (lat(c.lw) > 0.3 && lat(c.rw) > 0.3) return "LEFT";
      if (lat(c.lw) < -0.3 && lat(c.rw) < -0.3) return "RIGHT";
      return null;
    },
  },

  // ===== 08 แตะหัวไหล่ตัวเอง (สลับซ้าย-ขวา) =====
  {
    no: 8, id: "touch-shoulder", name: "แตะหัวไหล่ตัวเอง (สลับซ้าย-ขวา)", seated: true, level: "ง่าย",
    desc: "ซ้าย: ข้อมือขวาแตะไหล่ซ้าย | ขวา: ข้อมือซ้ายแตะไหล่ขวา",
    phases: ["LEFT", "RIGHT"], need: [LS, RS, LW, RW],
    detect: crossShoulderTouch,
  },

  // ===== 09 ยกมือแตะหัว-ลง =====
  {
    no: 9, id: "touch-head", name: "ยกมือแตะหัว-ลง", seated: true, level: "ง่าย",
    desc: "UP: ข้อมือข้างใดข้างหนึ่งอยู่ใกล้ระดับหู/หัว | DOWN: ข้อมือต่ำกว่าไหล่",
    phases: ["DOWN", "UP"], need: [NOSE, LS, RS, LW, RW],
    detect(c) {
      const nearHead = w => w.y < c.nose.y + 0.1 * c.sw && dist(w, c.nose) < 1.4 * c.sw;
      if (nearHead(c.lw) || nearHead(c.rw)) return "UP";
      if (c.lw.y > c.ls.y && c.rw.y > c.rs.y) return "DOWN";
      return null;
    },
  },

  // ===== 10 หมุนแขนเป็นวงใหญ่ =====
  {
    no: 10, id: "arm-circle", name: "หมุนแขนเป็นวงใหญ่ (ครบรอบ = 1 ครั้ง)", seated: true, level: "กลาง",
    desc: "ข้อมือผ่านจุดล่าง → ข้าง → บน ครบแล้วกลับมาล่าง = 1 ครั้ง (หมุนสองแขนพร้อมกัน)",
    phases: ["BOTTOM", "SIDE", "TOP"], need: [LS, RS, LW, RW],
    detect(c) {
      const sector = (w, s) => {
        const dx = Math.abs(w.x - s.x), dy = w.y - s.y;
        if (dy < -0.6 * c.sw) return "TOP";
        if (dy > 1.5 * c.sw) return "BOTTOM";
        if (dx > 0.9 * c.sw && Math.abs(dy) < 0.5 * c.sw) return "SIDE";
        return null;
      };
      const l = sector(c.lw, c.ls), r = sector(c.rw, c.rs);
      return l && l === r ? l : null;
    },
  },

  // ===== 11 ย่อตัว (Squat) =====
  {
    no: 11, id: "squat", name: "ย่อตัว (Squat)", seated: false, level: "กลาง",
    desc: "UP: สะโพกอยู่ระดับยืนปกติ | DOWN: สะโพกลดลงประมาณ 20-30% ของความยาวลำตัว",
    phases: ["UP", "DOWN"], need: [LS, RS, LH, RH],
    detect(c, mem) {
      // ระดับยืนปกติ = ตำแหน่งสะโพกที่สูงที่สุดที่เคยเห็น (ปรับตัวช้าๆ)
      const base = ref(mem, "hipY", c.midHip.y, "min");
      const drop = (c.midHip.y - base) / c.torso;
      if (drop > 0.22) return "DOWN";
      if (drop < 0.1) return "UP";
      return null;
    },
  },

  // ===== 12 ยกเข่าสูง =====
  {
    no: 12, id: "high-knees", name: "ยกเข่าสูง (นับทุกครั้งที่ยกข้างใดข้างหนึ่ง)", seated: false, level: "กลาง",
    desc: "UP: เข่าข้างหนึ่งสูงใกล้ระดับสะโพก | DOWN: เข่าลงต่ำกว่าสะโพกชัดเจน",
    phases: ["DOWN", "UP"], need: [LS, RS, LH, RH, LK, RK],
    detect: kneeLift,
  },

  // ===== 13 เตะขาไปข้างหน้า =====
  {
    no: 13, id: "kick-forward", name: "เตะขาไปข้างหน้า สลับซ้าย-ขวา", seated: false, level: "ยาก",
    desc: "UP: ข้อเท้าข้างหนึ่งสูงใกล้ระดับเอว | DOWN: ข้อเท้าทั้งสองลงพื้น",
    phases: ["DOWN", "UP"], need: [LS, RS, LH, RH, LA, RA],
    detect(c) {
      if (c.la.y < c.lh.y + 0.4 * c.torso || c.ra.y < c.rh.y + 0.4 * c.torso) return "UP";
      if (c.la.y > c.lh.y + 1.4 * c.torso && c.ra.y > c.rh.y + 1.4 * c.torso) return "DOWN";
      return null;
    },
  },

  // ===== 14 แกว่งขาไปด้านข้าง (Leg Swing) =====
  {
    no: 14, id: "leg-swing", name: "แกว่งขาไปด้านข้าง (Leg Swing)", seated: false, level: "ยาก",
    desc: "ซ้าย: ข้อเท้าซ้ายกางออกข้างไกลจากลำตัว | ขวา: ข้อเท้าขวากางออกข้างไกลจากลำตัว",
    phases: ["LEFT", "RIGHT"], need: [LS, RS, LH, RH, LA, RA],
    detect(c) {
      const lat = a => (a.x - c.midHip.x) / c.sw;   // บวก = ไปทางซ้ายของผู้เล่น
      if (lat(c.la) > 0.9) return "LEFT";
      if (lat(c.ra) < -0.9) return "RIGHT";
      return null;
    },
  },

  // ===== 15 เอียงตัวซ้าย-ขวา =====
  {
    no: 15, id: "side-tilt", name: "เอียงตัวซ้าย-ขวา", seated: true, level: "ง่าย",
    desc: "ซ้าย/ขวา: เส้นไหล่เอียงลงด้านนั้นเกิน 10 องศา",
    phases: ["LEFT", "RIGHT"], need: [LS, RS],
    detect(c) {
      const deg = Math.atan2(c.ls.y - c.rs.y, c.ls.x - c.rs.x) * 180 / Math.PI;
      if (deg > 10) return "LEFT";      // ไหล่ซ้ายต่ำลง
      if (deg < -10) return "RIGHT";    // ไหล่ขวาต่ำลง
      return null;
    },
  },

  // ===== 16 เอามือแตะไหล่ตรงข้าม =====
  {
    no: 16, id: "touch-opposite-shoulder", name: "เอามือแตะไหล่ตรงข้าม สลับซ้าย-ขวา", seated: true, level: "ง่าย",
    desc: "ซ้าย: ข้อมือขวาแตะไหล่ซ้าย | ขวา: ข้อมือซ้ายแตะไหล่ขวา",
    phases: ["LEFT", "RIGHT"], need: [LS, RS, LW, RW],
    detect: crossShoulderTouch,
  },

  // ===== 17 ก้มแตะเข่า-ยืดตรง =====
  {
    no: 17, id: "bend-touch-knee", name: "ก้มแตะเข่า-ยืดตรง", seated: false, level: "ง่าย",
    desc: "UP: ลำตัวตั้งตรง | DOWN: ข้อมือเข้าใกล้ระดับเข่า",
    phases: ["UP", "DOWN"], need: [LS, RS, LH, RH, LK, RK, LW, RW],
    detect(c) {
      const kneeY = (c.lk.y + c.rk.y) / 2;
      if (c.lw.y > kneeY - 0.35 * c.torso && c.rw.y > kneeY - 0.35 * c.torso) return "DOWN";
      const upright = (c.midHip.y - c.midSh.y) / c.torso;   // 1 = ตั้งตรงเต็มที่
      if (upright > 0.85) return "UP";
      return null;
    },
  },

  // ===== 18 เอื้อมมือแตะเพดาน =====
  {
    no: 18, id: "reach-up", name: "เอื้อมมือแตะเพดาน (ยืดตัว)", seated: true, level: "ง่าย",
    desc: "UP: ข้อมือสูงกว่าจมูกและแขนเหยียดตรง | DOWN: แขนลงข้างตัว",
    phases: ["DOWN", "UP"], need: [NOSE, LS, RS, LE, RE, LW, RW],
    detect(c) {
      if (c.lw.y < c.nose.y && c.rw.y < c.nose.y && c.elbowL > 150 && c.elbowR > 150) return "UP";
      if (c.lw.y > c.ls.y + 1.2 * c.sw && c.rw.y > c.rs.y + 1.2 * c.sw) return "DOWN";
      return null;
    },
  },

  // ===== 19 ก้มศีรษะ-เงยศีรษะ =====
  {
    no: 19, id: "head-nod", name: "ก้มศีรษะ-เงยศีรษะ", seated: true, level: "ง่าย",
    desc: "DOWN: จมูกต่ำลงเมื่อเทียบกับไหล่ | UP: จมูกกลับมาระดับปกติ",
    phases: ["UP", "DOWN"], need: [NOSE, LS, RS],
    detect(c, mem) {
      const gap = (c.midSh.y - c.nose.y) / c.sw;          // ระยะจมูกเหนือไหล่
      const base = ref(mem, "gap", gap, "max");           // ระยะตอนหน้าตรง
      if (gap < base * 0.7) return "DOWN";
      if (gap > base * 0.9) return "UP";
      return null;
    },
  },

  // ===== 20 หันหน้าซ้าย-ขวา =====
  {
    no: 20, id: "head-turn", name: "หันหน้าซ้าย-ขวา", seated: true, level: "กลาง",
    desc: "ซ้าย/ขวา: จมูกเลื่อนไปทางนั้นของกึ่งกลางไหล่",
    phases: ["LEFT", "RIGHT"], need: [NOSE, LS, RS],
    detect(c) {
      const off = (c.nose.x - c.midSh.x) / c.sw;          // บวก = ซ้ายของผู้เล่น
      if (off > 0.12) return "LEFT";
      if (off < -0.12) return "RIGHT";
      return null;
    },
  },

  // ===== 21 เอียงศีรษะซ้าย-ขวา =====
  {
    no: 21, id: "head-tilt", name: "เอียงศีรษะซ้าย-ขวา", seated: true, level: "กลาง",
    desc: "ซ้าย: หูซ้ายต่ำกว่าหูขวาชัดเจน | ขวา: หูขวาต่ำกว่าหูซ้ายชัดเจน",
    phases: ["LEFT", "RIGHT"], need: [L_EAR, R_EAR, LS, RS],
    detect(c) {
      const d = (c.lear.y - c.rear.y) / c.sw;             // บวก = หูซ้ายต่ำกว่า
      if (d > 0.12) return "LEFT";
      if (d < -0.12) return "RIGHT";
      return null;
    },
  },

  // ===== 22 ยักไหล่ขึ้น-ลง =====
  {
    no: 22, id: "shrug", name: "ยักไหล่ขึ้น-ลง", seated: true, level: "กลาง",
    desc: "UP: ไหล่ยกสูงเข้าใกล้หู | DOWN: ไหล่ลดลงปกติ",
    phases: ["DOWN", "UP"], need: [L_EAR, R_EAR, LS, RS],
    detect(c, mem) {
      const gap = ((c.ls.y - c.lear.y) + (c.rs.y - c.rear.y)) / 2 / c.sw;   // ระยะไหล่-หู
      const base = ref(mem, "gap", gap, "max");
      if (gap < base * 0.82) return "UP";
      if (gap > base * 0.92) return "DOWN";
      return null;
    },
  },

  // ===== 23 กระโดดตบ =====
  {
    no: 23, id: "jumping-jack", name: "กระโดดตบ", seated: false, jump: true, level: "ยาก",
    desc: "UP: ข้อมือเหนือหัว + ข้อเท้ากว้างกว่าไหล่ | DOWN: ข้อมือข้างตัว + ข้อเท้าชิดกัน",
    phases: ["DOWN", "UP"], need: [NOSE, LS, RS, LW, RW, LA, RA],
    detect(c) {
      const feet = dist(c.la, c.ra);
      if (c.lw.y < c.nose.y && c.rw.y < c.nose.y && feet > 1.2 * c.sw) return "UP";
      if (c.lw.y > c.ls.y + 0.8 * c.sw && c.rw.y > c.rs.y + 0.8 * c.sw && feet < 0.9 * c.sw) return "DOWN";
      return null;
    },
  },

  // ===== 24 กระโดดอยู่กับที่ =====
  {
    no: 24, id: "jump-in-place", name: "กระโดดอยู่กับที่", seated: false, jump: true, level: "ยาก",
    desc: "UP: สะโพกลอยสูงขึ้นชัดเจน | DOWN: สะโพกกลับระดับเดิม",
    phases: ["DOWN", "UP"], need: [LS, RS, LH, RH, LA, RA],
    detect(c, mem) {
      const y = c.midHip.y;
      if (mem.base === undefined) mem.base = y;
      const rise = (mem.base - y) / c.torso;
      if (rise > 0.12) return "UP";
      if (rise < 0.04) { mem.base += (y - mem.base) * 0.05; return "DOWN"; }
      return null;
    },
  },

  // ===== 25 เดินอยู่กับที่ ยกเข่าและแกว่งแขน =====
  {
    no: 25, id: "march-in-place", name: "เดินอยู่กับที่ ยกเข่าและแกว่งแขน", seated: false, level: "กลาง",
    desc: "ตรวจเหมือนท่ายกเข่าสูง และต้องแกว่งแขนด้วย (ข้อมือขยับขึ้น-ลง)",
    phases: ["DOWN", "UP"], need: [LS, RS, LH, RH, LK, RK, LW, RW],
    detect(c, mem) {
      mem.hist ??= { l: [], r: [] };
      for (const [k, w] of [["l", c.lw], ["r", c.rw]]) {
        mem.hist[k].push(w.y);
        if (mem.hist[k].length > 40) mem.hist[k].shift();
      }
      const range = a => Math.max(...a) - Math.min(...a);
      const armsMoving = mem.hist.l.length >= 15 &&
        (range(mem.hist.l) > 0.25 * c.sw || range(mem.hist.r) > 0.25 * c.sw);
      mem.note = armsMoving ? "" : "แกว่งแขนด้วย";
      return armsMoving ? kneeLift(c) : null;
    },
  },
];

export const getPose = id => POSES.find(p => p.id === id);

// ============================================================================
//  PoseTracker — ตัวติดตามสถานะของท่าหนึ่งท่า
//
//    const tracker = new PoseTracker(getPose("squat"), {
//      onPhase: ({ pose, phase, prev }) => ...,   // เมื่อเปลี่ยนสถานะ
//      onRep:   ({ pose, reps }) => ...,          // เมื่อครบ 1 ครั้ง
//    });
//    const r = tracker.update(result.landmarks[0], video.videoWidth / video.videoHeight);
//    // r.status: "ok" | "not_visible" | "no_person"   r.phase   r.reps   r.note
// ============================================================================
export class PoseTracker {
  constructor(pose, { minVisibility = 0.5, onPhase, onRep } = {}) {
    this.pose = pose;
    this.minVisibility = minVisibility;
    this.onPhase = onPhase;
    this.onRep = onRep;
    this.reset();
  }

  reset() {
    this.mem = {};
    this.phase = null;
    this.reps = 0;
    this.seen = new Set();
  }

  update(landmarks, aspect = 4 / 3) {
    if (!landmarks) return this.#result("no_person");
    const visible = this.pose.need.every(i => (landmarks[i]?.visibility ?? 0) > this.minVisibility);
    if (!visible) return this.#result("not_visible");

    const next = this.pose.detect(buildContext(landmarks, aspect), this.mem);
    if (next && next !== this.phase) {
      const prev = this.phase;
      this.phase = next;
      this.seen.add(next);
      this.onPhase?.({ pose: this.pose, phase: next, prev });

      const { phases } = this.pose;
      if (next === phases[0] && prev !== null && phases.every(p => this.seen.has(p))) {
        this.reps++;
        this.seen.clear();
        this.seen.add(next);
        this.onRep?.({ pose: this.pose, reps: this.reps });
      }
    }
    return this.#result("ok");
  }

  #result(status) {
    return { status, phase: this.phase, reps: this.reps, note: this.mem.note || "" };
  }
}
