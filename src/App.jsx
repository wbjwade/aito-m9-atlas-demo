import { useEffect, useRef, useState } from "react";
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ArrowsOut,
  CaretRight,
  Check,
  Cube,
  Eye,
  Info,
  Minus,
  Plus,
  X,
} from "@phosphor-icons/react";
import { createViewer } from "./viewer.js";
import { visibleCount } from "./model-state.js";
import { CATEGORIES, allVisible, vehicle } from "./m9-parts.js";

export function App() {
  const host = useRef(null),
    api = useRef(null),
    label = useRef(null),
    dialog = useRef(null),
    help = useRef(null);
  const [parts, setParts] = useState([]),
    [status, setStatus] = useState("loading"),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  const [visibility, setVisibility] = useState(allVisible),
    [filter, setFilter] = useState("all"),
    [group, setGroup] = useState(null);
  const [expansion, setExpansion] = useState(0),
    [selected, setSelected] = useState(null),
    [view, setView] = useState("perspective");
  const [autoRotate, setAutoRotate] = useState(false),
    [announcement, setAnnouncement] = useState("");
  const ready = status === "ready",
    count = visibleCount(parts, visibility);
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setError("");
    setParts([]);
    createViewer(
      host.current,
      {
        onReady: setParts,
        onSelect: setSelected,
        onLabel: (p) => {
          if (label.current)
            Object.assign(label.current.style, {
              left: `${p.x}px`,
              top: `${p.y}px`,
              opacity: p.visible ? "1" : "0",
            });
        },
      },
      controller.signal,
    )
      .then((instance) => {
        if (controller.signal.aborted) {
          instance?.dispose();
          return;
        }
        api.current = instance;
        setStatus("ready");
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(e.message);
          setStatus("error");
        }
      });
    return () => {
      controller.abort();
      api.current = null;
    };
  }, [attempt]);
  useEffect(() => {
    api.current?.setVisibility(visibility);
  }, [visibility, ready]);
  useEffect(() => {
    api.current?.setExpansion(expansion);
  }, [expansion, ready]);
  useEffect(() => {
    api.current?.setAutoRotate(autoRotate);
  }, [autoRotate, ready]);
  function showAll(value) {
    setVisibility(Object.fromEntries(CATEGORIES.map((c) => [c.id, value])));
    setAnnouncement(value ? "已显示全部部件" : "已隐藏全部部件");
  }
  function reset() {
    setVisibility(allVisible());
    setExpansion(0);
    setAutoRotate(false);
    setView("perspective");
    api.current?.reset();
    setAnnouncement("已恢复完整装配与默认视角");
  }
  function changeView(next) {
    setView(next);
    setAutoRotate(false);
    api.current?.setView(next);
  }
  function selectPart(part) {
    const next = { ...visibility, [part.category]: true };
    setVisibility(next);
    api.current?.setVisibility(next);
    api.current?.select(part.id);
  }
  const iconButton = (name, Icon, action) => (
    <button
      type="button"
      aria-label={name}
      title={name}
      disabled={!ready}
      onClick={action}
    >
      <Icon size={21} weight="light" />
    </button>
  );
  return (
    <main className="atlas">
      <header className="header">
        <div>
          <div className="title-line">
            <h1>{vehicle.title}</h1>
            <span className="badge">3D</span>
          </div>
          <p className="subtitle">{vehicle.name} · 交互结构图谱</p>
        </div>
        <button
          className="guide-button"
          aria-label="使用指南"
          ref={help}
          onClick={() => dialog.current.showModal()}
        >
          <Info size={18} weight="light" />
          <span>使用指南</span>
        </button>
      </header>
      <section className="workbench" aria-label="汽车结构浏览器">
        <aside className="systems panel">
          <div className="panel-heading">
            <h2>系统</h2>
            <span>{String(CATEGORIES.length).padStart(2, "0")}</span>
          </div>
          <div className="segments" aria-label="系统分类">
            {[
              ["all", "全部"],
              ["body", "车身"],
              ["chassis", "底盘"],
            ].map(([id, text]) => (
              <button
                key={id}
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
              >
                {text}
              </button>
            ))}
          </div>
          <div className="system-list">
            {CATEGORIES.filter(
              (c) => filter === "all" || c.section === filter,
            ).map((c) => {
              const items = parts.filter((p) => p.category === c.id);
              return (
                <div className="system-group" key={c.id}>
                  <div className="system-row">
                    <button
                      className="system-name"
                      aria-expanded={group === c.id}
                      aria-controls={`parts-${c.id}`}
                      disabled={!ready || !items.length}
                      onClick={() => setGroup(group === c.id ? null : c.id)}
                    >
                      <i style={{ background: c.color }} />
                      <span>{c.name}</span>
                      <CaretRight
                        size={12}
                        className={group === c.id ? "is-open" : ""}
                      />
                    </button>
                    <span className="part-count">
                      {ready ? items.length : "—"}
                    </span>
                    <label className="switch">
                      <input
                        type="checkbox"
                        aria-label={`显示${c.name}`}
                        checked={visibility[c.id]}
                        disabled={!ready || !items.length}
                        onChange={(e) =>
                          setVisibility((v) => ({
                            ...v,
                            [c.id]: e.target.checked,
                          }))
                        }
                      />
                      <span className="switch-track" />
                    </label>
                  </div>
                  {group === c.id && (
                    <div className="parts-list" id={`parts-${c.id}`}>
                      {items.map((p, i) => (
                        <button
                          key={p.id}
                          aria-pressed={selected?.id === p.id}
                          onClick={() => selectPart(p)}
                        >
                          <span>{p.name}</span>
                          <small>{String(i + 1).padStart(2, "0")}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="systems-footer">
            <span>{ready ? count : "—"} 个模型部件可见</span>
            <button disabled={!ready} onClick={() => showAll(count === 0)}>
              {count === 0 && ready ? "显示全部" : "隐藏全部"}
            </button>
          </div>
          <p className="systems-note">点击系统名称，查看并选择部件</p>
        </aside>
        <div className="viewer-column">
          <div className="view-topbar">
            <span className="model-source">
              <i />
              社区模型
            </span>
            <div className="view-presets" aria-label="观察视角">
              {[
                ["perspective", "3D"],
                ["front", "前视"],
                ["side", "侧视"],
                ["top", "俯视"],
              ].map(([id, text]) => (
                <button
                  key={id}
                  aria-pressed={view === id}
                  disabled={!ready}
                  onClick={() => changeView(id)}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
          <div className="stage" data-testid="stage">
            <div className="canvas-host" ref={host} aria-busy={!ready} />
            {status === "loading" && (
              <div className="stage-message" role="status">
                <Cube size={32} weight="light" />
                <h3>正在载入{vehicle.name}</h3>
                <p>准备模型与材质…</p>
              </div>
            )}
            {status === "error" && (
              <div className="stage-message" role="alert">
                <Info size={30} weight="light" />
                <h3>暂时无法显示模型</h3>
                <p>{error}</p>
                <button
                  className="text-action"
                  onClick={() => setAttempt((n) => n + 1)}
                >
                  重新加载
                </button>
              </div>
            )}
            {ready && count === 0 && (
              <div className="stage-message">
                <Eye size={30} weight="light" />
                <h3>所有部件已隐藏</h3>
                <button className="text-action" onClick={() => showAll(true)}>
                  显示全部部件
                </button>
              </div>
            )}
            {selected && (
              <div className="part-label" ref={label}>
                {selected.name}
              </div>
            )}
            <div className="view-tools" aria-label="模型操作">
              {iconButton("向左旋转", ArrowCounterClockwise, () =>
                api.current?.rotate(-1),
              )}
              {iconButton("向右旋转", ArrowClockwise, () =>
                api.current?.rotate(1),
              )}
              <hr />
              {iconButton("放大", Plus, () => api.current?.zoom(0.85))}
              {iconButton("缩小", Minus, () => api.current?.zoom(1.15))}
              <hr />
              {iconButton("恢复视角", ArrowsOut, () =>
                changeView("perspective"),
              )}
            </div>
          </div>
          <div className="model-caption">
            <span />
            {vehicle.caption}
            <span />
          </div>
          <div className="explode-panel panel">
            <div className="range-content">
              <div className="range-heading">
                <label htmlFor="explode">展开结构</label>
                <output htmlFor="explode">{expansion} %</output>
              </div>
              <input
                id="explode"
                type="range"
                min="0"
                max="100"
                step="1"
                value={expansion}
                aria-valuetext={`${expansion}% 展开`}
                disabled={!ready}
                onChange={(e) => setExpansion(Number(e.target.value))}
              />
              <div className="range-help">
                <span>完整装配</span>
                <span>分离部件</span>
              </div>
            </div>
            <button className="reset-button" disabled={!ready} onClick={reset}>
              <ArrowCounterClockwise size={28} weight="light" />
              <span>重置</span>
            </button>
          </div>
          <div className="stage-footer">
            <span>拖动旋转 · 滚轮缩放 · 点击查看部件</span>
            <button
              disabled={!ready}
              aria-pressed={autoRotate}
              onClick={() => setAutoRotate((v) => !v)}
            >
              <i />
              自动旋转
            </button>
          </div>
          {selected && (
            <section className="selected-card panel" aria-label="已选部件">
              <div>
                <span className="eyebrow">
                  {CATEGORIES.find((c) => c.id === selected.category)?.name}
                </span>
                <h3>{selected.name}</h3>
                <p>模型节点：{selected.sourceName}</p>
              </div>
              <button
                aria-label="取消选择"
                onClick={() => api.current?.select(null)}
              >
                <X size={20} weight="light" />
              </button>
            </section>
          )}
        </div>
      </section>
      <footer className="page-footer">
        <span>问界 M9 社区模型 · 非官方工程图谱 · 仅限非商业使用</span>
        <a href={vehicle.licenseUrl} target="_blank" rel="noreferrer">
          模型来源与授权 ↗
        </a>
      </footer>
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
      <dialog
        ref={dialog}
        onClose={() => help.current?.focus()}
        aria-labelledby="guide-title"
      >
        <div className="dialog-heading">
          <h2 id="guide-title">从整车，到每个细节</h2>
          <button aria-label="关闭指南" onClick={() => dialog.current.close()}>
            <X size={22} weight="light" />
          </button>
        </div>
        <p>
          拖动模型旋转，滚轮或双指手势缩放；也可以使用右侧按钮和上方预设视角。
        </p>
        <p>
          切换系统开关可隐藏部件。点击系统名称展开清单，再选择一个部件；也可以直接点选车身。
        </p>
        <p>
          拖动「展开结构」查看部件分布，点击「重置」恢复完整装配。模型区域支持左右方向键旋转、加减键缩放，Esc
          取消选择。
        </p>
        <div className="guide-note">
          <Info size={22} weight="light" />
          <p>
            本版使用你提供的问界 M9 社区模型，不是官方
            CAD。部件展开和四轮定位是可视化示意，不代表维修拆装顺序或精确尺寸；没有独立电池、电机和悬架模型。
          </p>
        </div>
        <p className="credits">
          原始模型：MattDoesBlender · aito-m9 / CC BY-NC-SA 4.0
          <br />
          仅限非商业使用，保留署名，模型改编沿用相同许可。已调整分组、车漆与轮组示意装配。
        </p>
        <button
          className="primary-button"
          onClick={() => dialog.current.close()}
        >
          <Check size={18} weight="light" />
          开始探索
        </button>
      </dialog>
    </main>
  );
}
