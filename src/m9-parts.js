export const CATEGORIES = [
  { id: "body", name: "车身覆盖件", color: "#91aab6", section: "body" },
  { id: "glass", name: "车窗与玻璃", color: "#628899", section: "body" },
  { id: "interior", name: "座舱与内饰", color: "#b39d85", section: "body" },
  { id: "doors", name: "车门与尾门", color: "#8b969c", section: "body" },
  { id: "frame", name: "底盘护板", color: "#7faaa4", section: "chassis" },
  { id: "trim", name: "饰件与附件", color: "#ba8c67", section: "body" },
  { id: "lights", name: "灯组与照明", color: "#9b8c80", section: "body" },
  { id: "wheels", name: "轮胎与轮毂", color: "#67767e", section: "chassis" },
];
export const allVisible = () =>
  Object.fromEntries(CATEGORIES.map((c) => [c.id, true]));
export const vehicle = {
  title: "AITO M9 Atlas",
  name: "问界 M9",
  caption: "AITO M9 · STRUCTURE EXPLORER",
  modelUrl: "/models/aito-m9.glb",
  licenseUrl: "/models/aito-m9/license.txt",
};
export const partKey = (name) => name.replace(/^gsraitom9_/, "");
export function classifyM9Part(name) {
  const key = partKey(name).toLowerCase();
  if (/^(tire|wheel)(_|$)/.test(key)) return "wheels";
  if (/^(dash|carpet|roofint|.*seats?|pedals|steer|doorpanel)(_|$)/.test(key))
    return "interior";
  if (/glass|windshield|backlight/.test(key)) return "glass";
  if (/^(headlight|taillight)(_|$)/.test(key)) return "lights";
  if (/^(door|tailgate)(_|$)/.test(key)) return "doors";
  if (key === "under") return "frame";
  if (/^(body|hood|bumper|fender)(_|$)/.test(key)) return "body";
  return "trim";
}
const LABELS = {
  body: "车身外壳",
  hood: "前舱盖",
  bumper_F: "前保险杠",
  bumper_R: "后保险杠",
  fender_FL: "左前翼子板",
  fender_FR: "右前翼子板",
  windshield: "前挡风玻璃",
  roofglass: "全景天幕",
  backlight: "后挡风玻璃",
  tailgate: "尾门",
  dash: "仪表台",
  dash_screens: "座舱显示屏",
  dash_screens_glass: "显示屏面板",
  carpet: "座舱地板",
  roofint: "车顶内衬",
  "3rd_seats": "第三排座椅",
  rear_seats: "第二排座椅",
  seat_FL: "驾驶席座椅",
  seat_FR: "副驾驶座椅",
  steer: "方向盘",
  pedals: "踏板",
  roofrack: "车顶行李架",
  under: "底盘护板",
  lettering: "车身标识",
  headlight_L: "左前大灯",
  headlight_R: "右前大灯",
  taillight_L: "左后尾灯",
  taillight_R: "右后尾灯",
  headlightglass_L: "左大灯灯罩",
  headlightglass_R: "右大灯灯罩",
  taillightglass_L: "左尾灯灯罩",
  taillightglass_R: "右尾灯灯罩",
  quarterglass_RL: "左后侧窗",
  quarterglass_RR: "右后侧窗",
};
const CORNERS = { FL: "左前", FR: "右前", RL: "左后", RR: "右后" };
export function labelM9Part(name) {
  const key = partKey(name);
  if (LABELS[key]) return LABELS[key];
  const match = key.match(
    /^(door|doorpanel|doorglass|tire|wheel)_(FL|FR|RL|RR)$/,
  );
  if (match)
    return (
      CORNERS[match[2]] +
      {
        door: "车门",
        doorpanel: "门内饰板",
        doorglass: "车窗",
        tire: "轮胎",
        wheel: "轮毂",
      }[match[1]]
    );
  return (
    CATEGORIES.find((c) => c.id === classifyM9Part(name))?.name || "模型部件"
  );
}
