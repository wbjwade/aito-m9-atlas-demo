export const CATEGORIES = [
  { id: "body", name: "车身覆盖件", color: "#91aab6", section: "body" },
  { id: "glass", name: "玻璃与灯组", color: "#628899", section: "body" },
  { id: "interior", name: "座舱与内饰", color: "#b39d85", section: "body" },
  { id: "doors", name: "车门与尾门", color: "#8b969c", section: "body" },
  { id: "frame", name: "底盘与框架", color: "#7faaa4", section: "chassis" },
  { id: "trim", name: "饰件与附件", color: "#ba8c67", section: "body" },
  {
    id: "suspension",
    name: "悬架与制动",
    color: "#9b8c80",
    section: "chassis",
  },
  { id: "wheels", name: "轮胎与轮毂", color: "#67767e", section: "chassis" },
];
export const allVisible = () =>
  Object.fromEntries(CATEGORIES.map((c) => [c.id, true]));
export const clampExpansion = (value) =>
  Math.min(100, Math.max(0, Number(value) || 0));
export function classifyPart(names, material = "") {
  const own = (
    names.find((n) => !/_0_\d+$/.test(n)) ||
    names[0] ||
    ""
  ).toLowerCase();
  const ancestry = names.join(" ").toLowerCase();
  if (/hub_[rl][fb]|wheel/.test(ancestry)) return "wheels";
  if (/suspensi/.test(own)) return "suspension";
  if (/leather|seat|lcd|carpet|belt|steer|texture_buttons|putih/.test(own))
    return "interior";
  if (
    /glass|windscreen|lights|foglight|tembus|indicat/.test(own) ||
    /^glass[._]|^breaklight/i.test(material) ||
    /black_lights_36/.test(ancestry)
  )
    return "glass";
  if (/door_|boot_dummy/.test(ancestry)) return "doors";
  if (/^chassis_26$|^black\.004_134$/.test(own)) return "frame";
  if (/body_|bonnet|bumper|bodysill|primary/.test(own) || material === "Paint")
    return "body";
  if (/interior|plastic|hitam/.test(own)) return "interior";
  return "trim";
}
export function partLabel(names, category) {
  const n = names.join(" ").toLowerCase();
  for (const [test, label] of [
    [/front_bumper|bump_front/, "前保险杠"],
    [/bump_rear|rear_bumper/, "后保险杠"],
    [/bonnet/, "前舱盖"],
    [/windscreen/, "前挡风玻璃"],
    [/door_lf/, "左前车门"],
    [/door_rf/, "右前车门"],
    [/door_lr/, "左后车门"],
    [/door_rr/, "右后车门"],
    [/boot_/, "尾门组件"],
    [/hub_rf|wheel_rf/, "右侧轮组"],
    [/hub_lf/, "左前轮毂"],
    [/hub_lb/, "左后轮毂"],
    [/hub_rb/, "右后轮毂"],
    [/suspensi/, "悬架组件"],
    [/lcd/, "中控显示屏"],
    [/steer/, "方向盘"],
    [/leather|seat/, "座舱座椅"],
    [/body_/, "车身外壳"],
    [/glass/, "车窗玻璃"],
    [/charge/, "充电口盖"],
  ]) {
    if (test.test(n)) return label;
  }
  return CATEGORIES.find((c) => c.id === category)?.name || "模型部件";
}
export const visibleCount = (parts, visibility) =>
  parts.filter((p) => visibility[p.category]).length;
