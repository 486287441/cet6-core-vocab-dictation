# Design System: 六级核心词默写

> **Kami 羊皮纸**（doc-kami-parchment）

## 画布与墨色
| Token | Hex |
|-------|-----|
| 羊皮纸底 | `#f5f4ed` |
| 次级纸 | `#efeee5` |
| 主文字 | `#1f1d18` |
| 次文字 | `#6b665b` |
| 唯一 accent | `#1B365D` |
| 发丝线 | `#d4d1c5` |

## 字体
- 中文：`Noto Serif SC` 400/500
- 英文：`Source Serif 4` 400/500（Charter 替代）
- 标题不超过 500，禁止 700+

## 形态
- 无 drop-shadow / blur / 渐变 / rgba
- **不用方框卡片**：分区靠横线 + 留白 + 不规则 `clip-path` 纸带
- 全页极淡 SVG 噪点（`html::before`，opacity ≈ 0.04，`mix-blend-mode: multiply`）
- 装饰线宽度受控（72% / 88% / 92% inset），不到页边

## 判词反馈（单色）
- 记得：左 rule 墨蓝 + 文案「已记住」
- 不熟：左 rule 暖灰 + 文案「需巩固」
- 禁止红绿等多色 accent

## 版式参考
- 首页：One-Pager（kicker + 标题 + lede + rule + metadata）
- 闪卡：folio 角标 + section rule + 西文词大号衬线
