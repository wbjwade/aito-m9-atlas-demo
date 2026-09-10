---
version: alpha
name: AITO M9 Atlas
description: 冷灰展台上的交互式汽车结构图谱
colors:
  primary: "#304951"
  ink: "#242d31"
  muted: "#627178"
  background: "#edf1f2"
  surface: "#ffffff"
  subtle: "#f0f3f4"
  line: "#dce3e6"
  focus: "#22617c"
typography:
  display:
    fontFamily: '"Helvetica Neue", "Segoe UI", sans-serif'
    fontSize: "48px"
    lineHeight: "1.15"
  body:
    fontFamily: '"Segoe UI", "Microsoft YaHei", sans-serif'
    fontSize: "16px"
    lineHeight: "1.5"
  data:
    fontFamily: '"Segoe UI", sans-serif'
    fontSize: "14px"
    lineHeight: "1.5"
rounded:
  sm: "8px"
  md: "14px"
  lg: "26px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  page: "32px"
components:
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  button:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
  secondary:
    backgroundColor: "{colors.subtle}"
    textColor: "{colors.muted}"
  divider:
    backgroundColor: "{colors.line}"
  focusIndicator:
    backgroundColor: "{colors.focus}"
  supportingText:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
---

## Overview

用户截图是布局依据。主任务为汽车旋转、显隐和结构展开；非营销主页。简体中文，桌面优先、手机可访问。2026-09-08 按用户要求替换为其提供的问界 M9 社区资产，保留布局与控件。不是官方工程 CAD，计数只来自加载模型总成。真实3D汽车是视觉中心，不用生成静态图冒充实时模型。无账号、上传或后端。

## Colors

冷灰背景、白色面板、深蓝灰控件。色点只辅助标签，不单独表达状态。仅浅色主题。M9 用原始PBR资产和中性环境光，车身深蓝灰、上部银灰；透明玻璃与银色轮毂分别调整，不整体覆盖所有材质。

M9 导入复核时将辅助文字令牌从 #69777e 微调至 #627178，修正浅灰分段控件上的对比度不足；不改变布局、字重、字号或控件尺寸。

## Typography

轻量无衬线大标题，中文系统字体，数字等宽。标题48px、面板20px、组名16px、辅助14px。手机标题32px。

## Layout

34px外边距，常规桌面左300px面板、右弹性3D展台、下方居中结构滑杆。参考1517px画板上左面板360px，间距54px，右侧保留110px留白。小于760px先展台后面板，文档自然滚动。截图播放器/录屏工具栏不是app内容，不复刻。

## Elevation & Depth

白色面板微阴影、26px圆角；展台无边框。部件标签为深蓝灰。不添加装饰背景。

## Shapes

分段按钮、原生范围输入与圆角开关。Phosphor light图标的细线条接近参考。

## Components

Model B：`src/styles.css :root`是规范CSS令牌主文件，本文件镜像这些颜色、字体和间距。组件统一使用CSS变量。组开关是有标签的原生checkbox，滑杆是原生range，筛选是aria-pressed按钮。所有显隐、展开、选中状态为本次会话，不持久化，不涉及数据修改。

组数与数量来自真实模型，未建模的电池/电机不能展示虚构零件。每个组的部件列表提供画布点选替代。旋转、缩放都有按钮及键盘。加载/错误固定在展台并提供重试；全隐藏有恢复。hover/focus/active/disabled齐全；自动旋转默认关闭，减少动态偏好不插值过渡。

M9 分类为车身覆盖件、车窗与玻璃、座舱与内饰、车门与尾门、底盘护板、饰件与附件、灯组与照明、轮胎与轮毂。四轮由源文件模板作展示性装配，车牌未定位模板不显示；界面明确非官方、非商业、非工程数据。总成部件是选择与展开单位，不按重复材质名拆散。

## Do's and Don'ts

保持参考的比例、留白和物件优先层级。不要加营销段落或虚构58部件，不声称官方图谱、维修指导或准确内部结构。
