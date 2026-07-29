/**
 * 门户导航页 - 编辑模式 + 基础图形
 * 依赖: LogicFlow 2.2.3 (CDN全局变量) + Layui + html2canvas
 */
layui.use(['layer', 'form', 'colorpicker'], function () {
    var layer = layui.layer,
        form = layui.form,
        colorpicker = layui.colorpicker;

    // 从全局 LogicFlow 对象获取节点/边基类
    var CircleNode = LogicFlow.CircleNode;
    var CircleNodeModel = LogicFlow.CircleNodeModel;
    var RectNode = LogicFlow.RectNode;
    var RectNodeModel = LogicFlow.RectNodeModel;
    var DiamondNode = LogicFlow.DiamondNode;
    var DiamondNodeModel = LogicFlow.DiamondNodeModel;
    var PolylineEdge = LogicFlow.PolylineEdge;
    var PolylineEdgeModel = LogicFlow.PolylineEdgeModel;
    var BezierEdge = LogicFlow.BezierEdge;
    var BezierEdgeModel = LogicFlow.BezierEdgeModel;
    var LineEdge = LogicFlow.LineEdge;
    var LineEdgeModel = LogicFlow.LineEdgeModel;

    // ========== 自定义节点样式工具函数 ==========
    function applyNodeStyle(model, style, defaultFill, defaultStroke) {
        var props = model.properties || {};
        style.fill = props.fill || defaultFill;
        style.stroke = props.stroke || defaultStroke;
        style.strokeWidth = props.strokeWidth ? parseInt(props.strokeWidth) : 2;
        if (props.strokeDasharray) style.strokeDasharray = props.strokeDasharray;
        return style;
    }
    function applyNodeTextStyle(model, style) {
    var props = model.properties || {};
    if (props.textColor) style.color = props.textColor;
    var ts = props.textStyle || {};
    if (ts.fontSize) style.fontSize = parseInt(ts.fontSize);
    return style;
  }

    // ========== 当前分组ID ==========
    var currentGroupId = null;

    // ========== 初始化 LogicFlow（可编辑配置） ==========
    var container = document.querySelector('#graph');
    var lf = new LogicFlow({
        container: container,
        width: container.clientWidth || 800,
        height: container.clientHeight || 600,
        grid: { size: 10, visible: true, type: 'dot', config: { color: '#e0e0e0', thickness: 1 } },
        keyboard: { enabled: true },
        edgeType: 'custom-bezier',
        stopScrollGraph: true,
        stopZoomGraph: false,
        adjustEdge: true,
        adjustEdgeMiddle: true,
        adjustEdgeStartAndEnd: true,
        allowRotate: true,
        allowResize: true,
        plugins: LogicFlow.MiniMap ? [LogicFlow.MiniMap] : [],
        pluginsOptions: LogicFlow.MiniMap ? {
            miniMap: {
                width: 150, height: 120, showEdge: true, isShowCloseIcon: true,
                rightPosition: 300, topPosition: 250
            }
        } : {},
        snapline: true,
        snaplineEpsilon: 10,
    });
    lf.updateEditConfig({ hoverOutline: false, edgeSelectedOutline: false });

    lf.setTheme({
        edgeAdjust: {
            r: 6, fill: '#1e9fff', stroke: '#fff', strokeWidth: 2,
            hover: { r: 8, fill: '#1890ff' }
        },
        // 箭头改为长三角形：长度20，宽度5
        arrow: {
            offset: 16,
            verticalLength: 4,
            stroke: '#333',   // 箭头边框颜色
            fill: '#333',     // 箭头填充颜色（实心时有效）
            strokeWidth: 0,      // 箭头边框粗细
            strokeLinecap: 'square',    // 平直末端（'round'圆头, 'square'方头）
            strokeLinejoin: 'round'   // 尖角连接（'round'圆角, 'bevel'斜角）
        },
        snapline: { stroke: '#555555', strokeWidth: 1, strokeDasharray: '3,3' }
    });

    // 全局拦截：禁用中心对齐，仅保留上下左右边缘对齐（覆盖内部拖拽和外部DnD）
    (function() {
        var _orig = lf.snaplineModel.setNodeSnapLine.bind(lf.snaplineModel);
        lf.snaplineModel.setNodeSnapLine = function(nodeData) {
            _orig(nodeData);
            var sm = lf.snaplineModel;
            sm.isShowHorizontal = false;
            sm.isShowVertical = false;
            var dragW = nodeData.width || 80, dragH = nodeData.height || 60;
            var dragTop = nodeData.y - dragH / 2;
            var dragBottom = nodeData.y + dragH / 2;
            var dragLeft = nodeData.x - dragW / 2;
            var dragRight = nodeData.x + dragW / 2;
            var nodes = lf.graphModel.nodes;
            var hFound = false, hY = 0;
            var vFound = false, vX = 0;
            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i];
                if (n.id === nodeData.id) continue;
                var b = { minX: n.x - n.width / 2, maxX: n.x + n.width / 2, minY: n.y - n.height / 2, maxY: n.y + n.height / 2 };
                // 水平对齐：拖拽节点顶部/底部 vs 其他节点顶部/底部
                if (!hFound) {
                    if (Math.abs(dragTop - b.minY) <= sm.epsilon || Math.abs(dragTop - b.maxY) <= sm.epsilon) {
                        hFound = true;
                        hY = Math.abs(dragTop - b.minY) <= sm.epsilon ? b.minY : b.maxY;
                    } else if (Math.abs(dragBottom - b.minY) <= sm.epsilon || Math.abs(dragBottom - b.maxY) <= sm.epsilon) {
                        hFound = true;
                        hY = Math.abs(dragBottom - b.minY) <= sm.epsilon ? b.minY : b.maxY;
                    }
                }
                // 垂直对齐：拖拽节点左侧/右侧 vs 其他节点左侧/右侧
                if (!vFound) {
                    if (Math.abs(dragLeft - b.minX) <= sm.epsilon || Math.abs(dragLeft - b.maxX) <= sm.epsilon) {
                        vFound = true;
                        vX = Math.abs(dragLeft - b.minX) <= sm.epsilon ? b.minX : b.maxX;
                    } else if (Math.abs(dragRight - b.minX) <= sm.epsilon || Math.abs(dragRight - b.maxX) <= sm.epsilon) {
                        vFound = true;
                        vX = Math.abs(dragRight - b.minX) <= sm.epsilon ? b.minX : b.maxX;
                    }
                }
                if (hFound && vFound) break;
            }
            if (hFound) { sm.isShowHorizontal = true; sm.position.y = hY; }
            if (vFound) { sm.isShowVertical = true; sm.position.x = vX; }
        };
    })();

    // ========== 注册基础图形节点类型（无流程节点） ==========
    class BaseRectModel extends RectNodeModel {
        initNodeData(data) { super.initNodeData(data); this.width = (data.properties && data.properties.width) || 80; this.height = (data.properties && data.properties.height) || 60; }
        getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffffff', '#333333'); }
        getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
    }
    lf.register({ type: 'rect', view: RectNode, model: BaseRectModel });
  class BaseCircleModel extends CircleNodeModel {
    constructor(data, graphModel) {
      super(data, graphModel);
      this.r = (data && data.properties && data.properties.r) || 40;
      this.minWidth = 10;
      this.minHeight = 10;
    }
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'circle', view: CircleNode, model: BaseCircleModel });
 class BaseDiamondModel extends DiamondNodeModel {
    initNodeData(data) { super.initNodeData(data); this.rx = (data.properties && data.properties.rx) || 40; this.ry = (data.properties && data.properties.ry) || 40; this.minWidth = 10; this.minHeight = 10; }
    getNodeStyle() { var s = super.getNodeStyle(); s.radius = 0; return applyNodeStyle(this, s, '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'diamond', view: DiamondNode, model: BaseDiamondModel });

  class OblongModel extends RectNodeModel {
   initNodeData(data) { super.initNodeData(data); this.width = (data.properties && data.properties.width) || 120; this.height = (data.properties && data.properties.height) || 40; this.radius = 4; }
    setAttributes() { }
    getNodeStyle() { var s = super.getNodeStyle(); s.radius = 4; return applyNodeStyle(this, s, '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'oblong', view: RectNode, model: OblongModel });

  class SharpRectModel extends RectNodeModel {
    initNodeData(data) { super.initNodeData(data); this.width = (data.properties && data.properties.width) || 120; this.height = (data.properties && data.properties.height) || 55; this.radius = 0; }
    setAttributes() { this.radius = 0; }
    getNodeStyle() { var s = super.getNodeStyle(); s.radius = 0; return applyNodeStyle(this, s, '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'sharp-rect', view: RectNode, model: SharpRectModel });

  class RoundRectModel extends RectNodeModel {
    initNodeData(data) { super.initNodeData(data); this.width = (data.properties && data.properties.width) || 120; this.height = (data.properties && data.properties.height) || 55; this.radius = 25; }
    setAttributes() { this.radius = 25; }
    getNodeStyle() { var s = super.getNodeStyle(); s.radius = 25; return applyNodeStyle(this, s, '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'round-rect', view: RectNode, model: RoundRectModel });

  class DocumentModel extends RectNodeModel {
    initNodeData(data) { super.initNodeData(data); this.width = (data.properties && data.properties.width) || 110; this.height = (data.properties && data.properties.height) || 65; }
      setAttributes() { }
      // 等比例缩放：保持默认宽高比 110:65
      resize(resizeInfo) {
          var ratio = 110 / 65;
          var w = resizeInfo.width, h = resizeInfo.height;
          if (w / h > ratio) { w = h * ratio; } else { h = w / ratio; }
          resizeInfo.width = w; resizeInfo.height = h;
          return RectNodeModel.prototype.resize.call(this, resizeInfo);
      }
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  class DocumentView extends RectNode {
      getShape() {
          const { x, y, width, height } = this.props.model;
          const style = this.props.model.getNodeStyle();
          // 三段波浪（凹-凸-凹），基于默认 110x65
          const w = width, ht = height, bottomY = y + ht / 2;
          const amp = ht * 0.15;
          const pathD = `M ${x - w / 2} ${y - ht / 2} L ${x + w / 2} ${y - ht / 2} L ${x + w / 2} ${bottomY} C ${x + w / 4} ${bottomY - amp}, ${x + w * 0.08} ${bottomY - amp}, ${x} ${bottomY} C ${x - w * 0.08} ${bottomY + amp}, ${x - w / 4} ${bottomY + amp}, ${x - w / 2} ${bottomY} Z`;
          return h('g', {}, [h('path', { d: pathD, fill: style.fill, stroke: style.stroke, strokeWidth: style.strokeWidth || 2, strokeDasharray: style.strokeDasharray || 'none' })]);
      }
  }
  lf.register({ type: 'document', view: DocumentView, model: DocumentModel });

  class SubprocessModel extends RectNodeModel {
    initNodeData(data) { super.initNodeData(data); this.width = (data.properties && data.properties.width) || 120; this.height = (data.properties && data.properties.height) || 55; }
    setAttributes() { }
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  class SubprocessView extends RectNode {
    getShape() {
      const { x, y, width, height } = this.props.model;
      const style = this.props.model.getNodeStyle();
      // 等比例计算内部线条位置（基于默认 160x70）
      const lineOffsetX = width * (30 / 160);
      return h('g', {}, [
          h('rect', { x: x - width / 2, y: y - height / 2, width: width, height: height, fill: style.fill, stroke: style.stroke, strokeWidth: style.strokeWidth || 2, strokeDasharray: style.strokeDasharray || 'none' }),
          h('line', { x1: x - width / 2 + lineOffsetX, y1: y - height / 2, x2: x - width / 2 + lineOffsetX, y2: y + height / 2, stroke: style.stroke, strokeWidth: style.strokeWidth || 2, strokeDasharray: style.strokeDasharray || 'none' }),
          h('line', { x1: x + width / 2 - lineOffsetX, y1: y - height / 2, x2: x + width / 2 - lineOffsetX, y2: y + height / 2, stroke: style.stroke, strokeWidth: style.strokeWidth || 2, strokeDasharray: style.strokeDasharray || 'none' })
      ]);
    }
  }
  lf.register({ type: 'subprocess', view: SubprocessView, model: SubprocessModel });

 class InternalStorageModel extends RectNodeModel {
    initNodeData(data) { super.initNodeData(data); this.width = (data.properties && data.properties.width) || 120; this.height = (data.properties && data.properties.height) || 55; }
    setAttributes() { }
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  class InternalStorageView extends RectNode {
    getShape() {
      const { x, y, width, height } = this.props.model;
      const style = this.props.model.getNodeStyle();
      // 等比例计算内部线条位置（基于默认 160x70）
        const topLineOffsetY = height * (15 / 55);
        const leftLineOffsetX = width * (20 / 120);
      return h('g', {}, [
          h('rect', { x: x - width / 2, y: y - height / 2, width: width, height: height, fill: style.fill, stroke: style.stroke, strokeWidth: style.strokeWidth || 2, strokeDasharray: style.strokeDasharray || 'none' }),
          h('line', { x1: x - width / 2, y1: y - height / 2 + topLineOffsetY, x2: x + width / 2, y2: y - height / 2 + topLineOffsetY, stroke: style.stroke, strokeWidth: style.strokeWidth || 2, strokeDasharray: style.strokeDasharray || 'none' }),
          h('line', { x1: x - width / 2 + leftLineOffsetX, y1: y - height / 2, x2: x - width / 2 + leftLineOffsetX, y2: y + height / 2, stroke: style.stroke, strokeWidth: style.strokeWidth || 2, strokeDasharray: style.strokeDasharray || 'none' })
      ]);
    }
  }
  lf.register({ type: 'internal-storage', view: InternalStorageView, model: InternalStorageModel });


    // ========== 注册自定义边类型 ==========
    function edgeStyleMixin(BaseModel) {
        return class extends BaseModel {
            initNodeData(data) { super.initNodeData(data); this.customTextPosition = true; }
            getEdgeStyle() {
                var style = super.getEdgeStyle();
                var props = this.properties || {};
                if (props.stroke) style.stroke = props.stroke;
                if (props.strokeWidth) style.strokeWidth = parseInt(props.strokeWidth);
                if (props.strokeDasharray) style.strokeDasharray = props.strokeDasharray;
                return style;
            }
            getTextStyle() {
                var style = super.getTextStyle();
                var props = this.properties || {};
                var edgeStyle = this.getEdgeStyle();
                style.fontSize = 12;
                style.color = props.textColor || edgeStyle.stroke || '#666';
                style.background = { fill: '#ffffff', stroke: 'none' };
                return style;
            }
            getTextPosition() {
                var props = this.properties || {};
                var pos = props.textPosition;
                if (!pos || pos === 'middle') return super.getTextPosition();
                var sp = this.startPoint, ep = this.endPoint;
                if (pos === 'start') return { x: sp.x + (ep.x - sp.x) * 0.15, y: sp.y + (ep.y - sp.y) * 0.15 };
                if (pos === 'end') return { x: sp.x + (ep.x - sp.x) * 0.85, y: sp.y + (ep.y - sp.y) * 0.85 };
                return super.getTextPosition();
            }
        };
    }
    class CustomBezierModel extends edgeStyleMixin(BezierEdgeModel) { }
    lf.register({ type: 'custom-bezier', view: BezierEdge, model: CustomBezierModel });
    class CustomPolylineModel extends edgeStyleMixin(PolylineEdgeModel) { }
    lf.register({ type: 'custom-polyline', view: PolylineEdge, model: CustomPolylineModel });
    class CustomLineModel extends edgeStyleMixin(LineEdgeModel) { }
    lf.register({ type: 'custom-line', view: LineEdge, model: CustomLineModel });
    // 直角折线：继承折线但强制 radius:0 消除圆角
    class CustomRightPolylineModel extends edgeStyleMixin(PolylineEdgeModel) {
        getEdgeStyle() { var s = super.getEdgeStyle(); s.radius = 0; return s; }
    }
    lf.register({ type: 'custom-right-polyline', view: PolylineEdge, model: CustomRightPolylineModel });

    // 渲染空画布
    lf.render({ nodes: [], edges: [] });
    setTimeout(function () { lf.resize(); updateEmptyState(); }, 100);
    window.lf = lf;

    // 确保 MiniMap 插件已安装并显示
    (function ensureMiniMap() {
        var MiniMapCls = (window.Extension && window.Extension.MiniMap) || LogicFlow.MiniMap;
        console.log('[MiniMap] 检查插件:', MiniMapCls, '| lf.extension:', lf.extension);
        if (!MiniMapCls) {
            console.warn('[MiniMap] 插件类未找到');
            return;
        }
        // 检查是否已安装
        if (lf.extension && lf.extension.miniMap) {
            console.log('[MiniMap] 插件已安装，尝试显示');
            try {
                //lf.extension.miniMap.show();
                console.log('[MiniMap] 显示成功');
            } catch (e) {
                console.warn('[MiniMap] show() 失败:', e);
            }
            return;
        }
        // 尝试手动安装
        console.log('[MiniMap] 尝试手动安装插件');
        try {
            lf.installPlugin(MiniMapCls, {
                width: 150, height: 120, showEdge: true, isShowCloseIcon: true,
                rightPosition: 300, topPosition: 250
            });
            console.log('[MiniMap] 安装成功, lf.extension:', lf.extension);
            // 安装后显示
            if (lf.extension && lf.extension.miniMap) {
                setTimeout(function () {
                    lf.extension.miniMap.show();
                    console.log('[MiniMap] 延迟显示成功');
                }, 100);
            }
        } catch (e) {
            console.warn('[MiniMap] 安装失败:', e);
        }
        
    })();
    // ========== 键盘快捷键 ==========
    // Delete 键删除选中元素
    lf.keyboard.on('delete', function () {
        var selected = lf.getSelectElements(true);
        if (selected.nodes && selected.nodes.length > 0) {
            for (var i = 0; i < selected.nodes.length; i++) {
                lf.deleteNode(selected.nodes[i].id);
            }
        }
        if (selected.edges && selected.edges.length > 0) {
            for (var j = 0; j < selected.edges.length; j++) {
                lf.deleteEdge(selected.edges[j].id);
            }
        }
        clearPanel();
    });
    // 方向键微调选中节点位置（每次移动一个网格 = 10px）
    var ARROW_STEP = 10;
    function moveSelectedByArrow(dx, dy) {
        var selected = lf.getSelectElements(true);
        if (!selected.nodes || selected.nodes.length === 0) return;
        var nodeIds = selected.nodes.map(function (n) { return n.id; });
        lf.graphModel.moveNodes(nodeIds, dx, dy);
        // 更新属性面板中的坐标显示
        if (selected.nodes.length === 1 && currentElementId === selected.nodes[0].id) {
            var xInput = document.querySelector('input[name="nodeX"]');
            var yInput = document.querySelector('input[name="nodeY"]');
            if (xInput) xInput.value = Math.round(selected.nodes[0].x + dx);
            if (yInput) yInput.value = Math.round(selected.nodes[0].y + dy);
        }
    }
    lf.keyboard.on('up', function () { moveSelectedByArrow(0, -ARROW_STEP); });
    lf.keyboard.on('down', function () { moveSelectedByArrow(0, ARROW_STEP); });
    lf.keyboard.on('left', function () { moveSelectedByArrow(-ARROW_STEP, 0); });
    lf.keyboard.on('right', function () { moveSelectedByArrow(ARROW_STEP, 0); });

    // ========== 模块列表（远程加载） ==========
    var _moduleList = [];
    function getModules() {
        $.ajax({
            type: 'POST', url: '/Setting/UISolution/Ashx/CustomTopMenu.ashx', async: false,
            data: { act: 'GetAllChildMenu' },
            success: function (retData) {
                try { _moduleList = (typeof retData === 'string') ? JSON.parse(retData) : retData; } catch (e) { _moduleList = []; }
                console.log('[Navigator] 模块加载成功:', _moduleList.length, '条');
            },
            error: function (xhr, status, err) {
                console.error('[Navigator] 模块加载失败:', status, err);
                _moduleList = [];
            }
        });
    }
    getModules();

    function buildModuleOptions(moduleVal) {
  
        var html = '<option value="">请搜索模块</option>';
        if (_moduleList.length === 0) { html += '<option value="">暂无模块</option>'; }
        for (var i = 0; i < _moduleList.length; i++) {
            var item = _moduleList[i];
            var selected = (String(item.Id) === String(moduleVal)) ? ' selected' : '';
            html += '<option value="' + item.Id + '" data-flag="' + item.Flag + '" data-sectionid="' + (item.SectionId || 0) + '" data-name="' + item.Name + '"' + selected + '>' + item.Name + '</option>';
        }
        return html;
    }



    // ========== 导航分组 ==========
    var _groupList = [];
    var currentGroupId = null; // 当前查看/设计的分组ID



    function getGroupList() {
        var list = [];
        $.ajax({
            type: 'POST', url: '/Common/Ashx/Common_Nav.ashx',
            data: { act: 'Get_DesktopNavigatorGroup' }, async: false,
            success: function (retData) {
                if (!retData || retData === '') {
                    list = [
                        { ModuleGroupId: 1481, ModuleGroupName: '内部办公' },
                        { ModuleGroupId: 1482, ModuleGroupName: '客户管理' },
                        { ModuleGroupId: 1611, ModuleGroupName: '售前管理' },
                        { ModuleGroupId: 1650, ModuleGroupName: '销售管理' },
                        { ModuleGroupId: 1612, ModuleGroupName: '服务管理' }
                    ];
                } else {
                    try { list = (typeof retData === 'string') ? JSON.parse(retData) : retData; } catch (e) { list = []; }
                }
            },
            error: function () { list = []; }
        });
        // 如果接口失败，使用默认数据
        if (!list || list.length === 0) {
            list = [
                { ModuleGroupId: 1481, ModuleGroupName: '内部办公' },
                { ModuleGroupId: 1482, ModuleGroupName: '客户管理' },
                { ModuleGroupId: 1611, ModuleGroupName: '售前管理' },
                { ModuleGroupId: 1650, ModuleGroupName: '销售管理' },
                { ModuleGroupId: 1612, ModuleGroupName: '服务管理' }
            ];
        }
        return list;
    }

    function loadGroupList() {
        _groupList = getGroupList();

        // 渲染顶部下拉框
        var selectEl = document.getElementById('group-select');
        var selectHtml = '';
        for (var j = 0; j < _groupList.length; j++) {
            var item = _groupList[j];
            var selected = (j === 0) ? ' selected' : '';
            selectHtml += '<option value="' + item.ModuleGroupId + '"' + selected + '>' + item.ModuleGroupName + '</option>';
        }
        selectEl.innerHTML = selectHtml;

        // 下拉框切换 → 加载流程图
        selectEl.onchange = function () {
            var groupId = this.value;
            currentGroupId = groupId;
            loadGroupFlow(groupId);
        };

        // 默认第一个分组
        var defaultGroup = _groupList.length > 0 ? _groupList[0] : null;
        if (defaultGroup) {
            currentGroupId = defaultGroup.ModuleGroupId;
            if (selectEl) selectEl.value = currentGroupId;
            loadGroupFlow(currentGroupId);
        }
        // 默认开启框选
        if (lf.openSelectionSelect) {
            setTimeout(function () {
                lf.openSelectionSelect();
                var btn = document.getElementById('ctb-select');
                if (btn) btn.classList.add('tb-active');
            }, 200);
        }
    }
    // ========== 空画布提示 ==========
    function updateEmptyState() {
        var el = document.getElementById('empty-canvas');
        if (!el) return;
        var graphData = lf.getGraphData();
        var isEmpty = (!graphData.nodes || graphData.nodes.length === 0) && (!graphData.edges || graphData.edges.length === 0);
        el.style.display = isEmpty ? 'block' : 'none';
    }
    // ========== 加载分组流程图数据 ==========
    function loadGroupFlow(groupId) {
        $.ajax({
            type: 'POST', url: '/Common/Ashx/Common_Nav.ashx',
            data: { act: 'GetData_Desktop_BNavigator_DiagramDataNew', moduleGroupId: groupId },
            async: false,
            success: function (retData) {
                if (retData && retData !== '') {
                    try {
                        var data = (typeof retData === 'string') ? JSON.parse(retData) : retData;
                        var savedTransform = data.transform || null;
                        lf.render(data);
                        // 恢复保存的画布缩放和平移位置
                        if (savedTransform) {
                            var tm = lf.graphModel.transformModel;
                            tm.SCALE_X = savedTransform.SCALE_X;
                            tm.SCALE_Y = savedTransform.SCALE_Y;
                            tm.TRANSLATE_X = savedTransform.TRANSLATE_X;
                            tm.TRANSLATE_Y = savedTransform.TRANSLATE_Y;
                            tm.emitGraphTransform('zoom');
                        }
                    } catch (e) {
                        lf.render({ nodes: [], edges: [] });
                    }
                } else {
                    lf.render({ nodes: [], edges: [] });
                }
                setTimeout(function () { lf.resize(); updateEmptyState(); }, 100);
            },
            error: function () {
                lf.render({ nodes: [], edges: [] });
                setTimeout(updateEmptyState, 100);
            }
        });
        setTimeout(function () { lf.resize(); updateEmptyState(); }, 100);
        clearPanel();
    }

    // (switchMode 已移除，页面始终为编辑模式)

    // ========== 拖拽添加节点 ==========
    // 各类型节点的实际画布尺寸（与节点模型默认值一致）
    var nodeActualSizes = {
        'rect': { w: 80, h: 60 }, 'circle': { w: 80, h: 80 }, 'diamond': { w: 80, h: 80 },
        'oblong': { w: 120, h: 40 }, 'sharp-rect': { w: 120, h: 55 }, 'round-rect': { w: 120, h: 55 },
        'document': { w: 110, h: 65 }, 'subprocess': { w: 120, h: 55 }, 'internal-storage': { w: 120, h: 55 }
    };
    // 拖拽预览已改为透明图片，画布上的假节点提供视觉反馈
    var draggingType = '';
    var draggingNode = null;
    document.querySelectorAll('.node-item').forEach(function (item) {
        item.addEventListener('dragstart', function (e) {
            var type = this.getAttribute('data-type');
            e.dataTransfer.setData('type', type);
            draggingType = type;
            // 用透明图片隐藏浏览器默认拖拽幽灵图（画布上的假节点已提供视觉反馈）
            var img = new Image();
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            e.dataTransfer.setDragImage(img, 0, 0);
        });
        item.addEventListener('dragend', function () {
            draggingType = '';
            lf.removeNodeSnapLine();
            if (draggingNode) {
                lf.graphModel.removeFakeNode();
                draggingNode = null;
            }
        });
    });


    var graphEl = document.getElementById('graph');
    var lastMouseX = 0, lastMouseY = 0;

    document.addEventListener('dragover', function (e) {
        e.preventDefault();
        lastMouseX = e.clientX; lastMouseY = e.clientY;
        // 拖拽过程中显示对齐线
        if (draggingType) {
            var point = lf.getPointByClient(e.clientX, e.clientY);
            var size = nodeActualSizes[draggingType] || { w: 80, h: 60 };
            var x = point.canvasOverlayPosition.x, y = point.canvasOverlayPosition.y;
            // 首次进入画布：创建假节点用于对齐线计算
            if (!draggingNode) {
                draggingNode = lf.createFakeNode({
                    type: draggingType, x: x, y: y,
                    width: size.w, height: size.h,
                    properties: {}
                });
            }
            // 更新假节点位置与吸附线（全局拦截已处理对齐策略）
            if (draggingNode) {
                draggingNode.moveTo(x, y);
                lf.setNodeSnapLine(draggingNode.getData());
                // 磁吸：对齐线亮起时修正假节点位置（区分上下左右边缘）
                var sm = lf.snaplineModel;
                if (sm) {
                    var dragH = draggingNode.height, dragW = draggingNode.width;
                    if (sm.isShowHorizontal) {
                        var topY2 = draggingNode.y - dragH / 2;
                        var bottomY2 = draggingNode.y + dragH / 2;
                        var snapY;
                        if (Math.abs(topY2 - sm.position.y) < sm.epsilon) {
                            snapY = sm.position.y + dragH / 2;  // 顶部对齐
                        } else if (Math.abs(bottomY2 - sm.position.y) < sm.epsilon) {
                            snapY = sm.position.y - dragH / 2;  // 底部对齐
                        } else {
                            snapY = sm.position.y;
                        }
                        if (Math.abs(snapY - y) > 1) { draggingNode.moveTo(draggingNode.x, snapY); }
                    }
                    if (sm.isShowVertical) {
                        var leftX2 = draggingNode.x - dragW / 2;
                        var rightX2 = draggingNode.x + dragW / 2;
                        var snapX;
                        if (Math.abs(leftX2 - sm.position.x) < sm.epsilon) {
                            snapX = sm.position.x + dragW / 2;  // 左侧对齐
                        } else if (Math.abs(rightX2 - sm.position.x) < sm.epsilon) {
                            snapX = sm.position.x - dragW / 2;  // 右侧对齐
                        } else {
                            snapX = sm.position.x;
                        }
                        if (Math.abs(snapX - x) > 1) { draggingNode.moveTo(snapX, draggingNode.y); }
                    }
                }
            }
        }
    });

    graphEl.addEventListener('drop', function (e) {
        e.preventDefault(); e.stopPropagation();
        var type = e.dataTransfer.getData('type');
        if (!type) return;
        var clientX = lastMouseX || e.clientX, clientY = lastMouseY || e.clientY;
        var x, y;
        // 使用假节点的对齐位置（磁吸后已吸附到精确位置）
        if (draggingNode) {
            x = draggingNode.x;
            y = draggingNode.y;
        } else {
            var point = lf.getPointByClient(clientX, clientY);
            x = point.canvasOverlayPosition.x;
            y = point.canvasOverlayPosition.y;
        }
        var textMap = {
            'rect': '矩形', 'oblong': '长方形', 'sharp-rect': '直角长方形', 'round-rect': '圆角长方形',
            'document': '文档', 'subprocess': '子流程', 'internal-storage': '内部存储',
            'circle': '圆形', 'diamond': '菱形'
        };
        lf.addNode({
            type: type, x: x, y: y,
            text: { value: textMap[type] || '新节点', x: x, y: y },
            properties: { owner: '', desc: '', fill: '', stroke: '', strokeWidth: '', module: '' }
        });
        lf.removeNodeSnapLine();
        if (draggingNode) {
            lf.graphModel.removeFakeNode();
            draggingNode = null;
        }
        draggingType = '';
        lastMouseX = 0; lastMouseY = 0;
        updateEmptyState();
    });

    // ========== 属性面板逻辑 ==========
    var currentElementId = null, currentElementType = null;
    var currentNodeTextColor = '';

    var defaultColors = {
        'rect': { fill: '#ffffff', stroke: '#333333' },
        'oblong': { fill: '#ffffff', stroke: '#333333' },
        'sharp-rect': { fill: '#ffffff', stroke: '#333333' },
        'round-rect': { fill: '#ffffff', stroke: '#333333' },
        'document': { fill: '#ffffff', stroke: '#333333' },
        'subprocess': { fill: '#ffffff', stroke: '#333333' },
        'internal-storage': { fill: '#ffffff', stroke: '#333333' },
        'circle': { fill: '#ffffff', stroke: '#333333' },
        'diamond': { fill: '#ffffff', stroke: '#333333' }
    };

    function renderNodePanel(data) {
    currentElementId = data.id;
    currentElementType = 'node';
    var props = data.properties || {};
    var ts = props.textStyle || {};
    var curFontSize = ts.fontSize || 14;
    var colors = defaultColors[data.type] || { fill: '#ffffff', stroke: '#333333' };
    var textVal = (data.text && data.text.value) || '';
    var mInfo = props.moduleInfo || {};
    var moduleVal = mInfo.Id || props.module || (_moduleList.length > 0 ? String(_moduleList[0].Id) : '');

    document.getElementById('props-content').innerHTML =
      '<form class="layui-form" lay-filter="propsForm">' +
        '<div class="props-section"><div class="props-section-title">基本信息</div>' +
          // '<div class="layui-form-item"><label class="layui-form-label">节点 ID</label><div class="layui-input-block"><input type="text" value="' + data.id + '" disabled class="layui-input layui-disabled"></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">节点文本</label><div class="layui-input-block"><input type="text" name="text" value="' + textVal + '" class="layui-input"></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">所属模块</label><div class="layui-input-block">' + '<select name="module" lay-search lay-filter="module">' + buildModuleOptions(moduleVal) + '</select>' + '</div></div>' +
        '</div>' +
        '<div class="props-section"><div class="props-section-title">详细描述</div>' +
    '<div class="layui-form-item"><label class="layui-form-label">负责人</label><div class="layui-input-block"><input type="text" name="owner" value="' + (props.owner || '') + '" placeholder="请输入负责人" class="layui-input"></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">描述</label><div class="layui-input-block"><textarea name="desc" style="width: 100%;" placeholder="请输入节点描述">' + (props.desc || '') + '</textarea></div></div>' +
        '</div>' +
        '<div class="props-section"><div class="props-section-title">外观样式</div>' +
          '<div class="layui-form-item"><label class="layui-form-label">背景色</label><div class="layui-input-block"><div class="color-field" id="node-fill-color"></div></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">边框色</label><div class="layui-input-block"><div class="color-field" id="node-stroke-color"></div></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">字体色</label><div class="layui-input-block"><div class="color-field" id="node-text-color"></div></div></div>' +
    '<div class="layui-form-item"><label class="layui-form-label">边框样式</label><div class="layui-input-block"><select name="nodeStrokeDasharray" lay-filter="nodeStrokeDasharray"><option value=""' + (!props.strokeDasharray ? ' selected' : '') + '>实线</option><option value="5,5"' + (props.strokeDasharray === '5,5' ? ' selected' : '') + '>虚线</option></select></div></div>' +
    '<div class="layui-form-item"><label class="layui-form-label">字体大小</label><div class="layui-input-block"><select name="fontSize" lay-filter="fontSize"><option value="12"' + (curFontSize == 12 ? ' selected' : '') + '>12px</option><option value="14"' + (curFontSize == 14 ? ' selected' : '') + '>14px</option><option value="16"' + (curFontSize == 16 ? ' selected' : '') + '>16px</option><option value="18"' + (curFontSize == 18 ? ' selected' : '') + '>18px</option><option value="20"' + (curFontSize == 20 ? ' selected' : '') + '>20px</option><option value="24"' + (curFontSize == 24 ? ' selected' : '') + '>24px</option></select></div></div>' +
        '</div>' +
        '<div class="props-actions">' +
          '<button type="submit" class="layui-btn" lay-submit lay-filter="saveProps">保存修改</button>' +
          '<button type="button" class="layui-btn layui-btn-danger" id="btn-delete">删除节点</button>' +
        '</div></form>';
    form.render('select');
    console.log('[Navigator] 渲染节点面板, 模块数:', _moduleList.length);

    colorpicker.render({ elem: '#node-fill-color', color: props.fill || colors.fill, done: function (c) { lf.setProperties(data.id, { fill: c }); } });
    colorpicker.render({ elem: '#node-stroke-color', color: props.stroke || colors.stroke, done: function (c) { lf.setProperties(data.id, { stroke: c }); } });
    currentNodeTextColor = props.textColor || '#333333';
    colorpicker.render({ elem: '#node-text-color', color: currentNodeTextColor, done: function (c) { currentNodeTextColor = c; lf.setProperties(data.id, { textColor: c }); } });
    // 边框样式实时同步
        form.on('select(nodeStrokeDasharray)', function (obj) {
            lf.setProperties(data.id, { strokeDasharray: obj.value });
        });
        // 字体大小实时切换
    form.on('select(fontSize)', function (obj) {
      var size = parseInt(obj.value);
      var nodeModel = lf.graphModel.getNodeModelById(data.id);
      if (nodeModel) {
        var ts = nodeModel.properties.textStyle || {};
        ts.fontSize = size;
        nodeModel.setProperties({ textStyle: ts });
      }
    });
        document.getElementById('btn-delete').onclick = function () { lf.deleteNode(currentElementId); clearPanel(); };
        // 节点文本实时同步
        var textInput = document.querySelector('input[name="text"]');
        if (textInput) {
            textInput.addEventListener('input', function () {
                lf.updateText(data.id, this.value);
            });
        }
        // 模块选择实时同步
        form.on('select(module)', function (obj) {
            var $opt = $(obj.elem).find('option:selected');
            var moduleInfo = {
                Id: parseInt(obj.value) || 0,
                Flag: parseInt($opt.attr('data-flag')) || 0,
                SectionId: parseInt($opt.attr('data-sectionid')) || 0,
                Name: $opt.attr('data-name') || ''
            };
            lf.setProperties(data.id, { moduleInfo: moduleInfo });
        });
        // 负责人实时同步
        var ownerInput = document.querySelector('input[name="owner"]');
        if (ownerInput) {
            ownerInput.addEventListener('input', function () {
                lf.setProperties(data.id, { owner: this.value });
            });
        }
        // 描述实时同步
        var descArea = document.querySelector('textarea[name="desc"]');
        if (descArea) {
            descArea.addEventListener('input', function () {
                lf.setProperties(data.id, { desc: this.value });
            });
        }
  }

    function renderEdgePanel(data) {
        currentElementId = data.id;
        currentElementType = 'edge';
        var props = data.properties || {};
        var textVal = (data.text && data.text.value) || '';
        var edgeModel = lf.graphModel.getEdgeModelById(data.id);
        var currentEdgeType = edgeModel ? edgeModel.type : 'custom-bezier';

        document.getElementById('props-content').innerHTML =
            '<form class="layui-form" lay-filter="propsForm">' +
            '<div class="props-section"><div class="props-section-title">文本信息</div>' +
            '<div class="layui-form-item"><label class="layui-form-label">连线文案</label><div class="layui-input-block"><input type="text" name="text" value="' + textVal + '" placeholder="如：同意、拒绝" class="layui-input"></div></div>' +
        '<div class="layui-form-item"><label class="layui-form-label">文本位置</label><div class="layui-input-block"><select name="textPosition" lay-filter="textPosition">' +
            '<option value="start"' + (props.textPosition === 'start' ? ' selected' : '') + '>起点附近</option>' +
            '<option value="middle"' + (!props.textPosition || props.textPosition === 'middle' ? ' selected' : '') + '>中间位置</option>' +
            '<option value="end"' + (props.textPosition === 'end' ? ' selected' : '') + '>终点附近</option></select></div></div>' +
            '</div>' +
            '<div class="props-section"><div class="props-section-title">线条样式</div>' +
        '<div class="layui-form-item"><label class="layui-form-label">线条类型</label><div class="layui-input-block"><select name="edgeType" lay-filter="edgeType">' +
            '<option value="custom-bezier"' + (currentEdgeType === 'custom-bezier' ? ' selected' : '') + '>〰️ 曲线</option>' +
        '<option value="custom-polyline"' + (currentEdgeType === 'custom-polyline' ? ' selected' : '') + '>📐 折线</option>' +
        '<option value="custom-right-polyline"' + (currentEdgeType === 'custom-right-polyline' ? ' selected' : '') + '>📐 直角折线</option>' +
            '<option value="custom-line"' + (currentEdgeType === 'custom-line' ? ' selected' : '') + '>📏 直线</option></select></div></div>' +
            '<div class="layui-form-item"><label class="layui-form-label">线条颜色</label><div class="layui-input-block"><div class="color-field" id="edge-stroke-color"></div></div></div>' +
            '<div class="layui-form-item"><label class="layui-form-label">文字颜色</label><div class="layui-input-block"><div class="color-field" id="edge-text-color"></div></div></div>' +
        '<div class="layui-form-item"><label class="layui-form-label">线条粗细</label><div class="layui-input-block"><select name="strokeWidth" lay-filter="strokeWidth">' +
            '<option value="1"' + (props.strokeWidth == 1 ? ' selected' : '') + '>1 px</option>' +
            '<option value="2"' + (!props.strokeWidth || props.strokeWidth == 2 ? ' selected' : '') + '>2 px</option>' +
            '<option value="3"' + (props.strokeWidth == 3 ? ' selected' : '') + '>3 px</option></select></div></div>' +
        '<div class="layui-form-item"><label class="layui-form-label">线条样式</label><div class="layui-input-block"><select name="strokeDasharray" lay-filter="strokeDasharray">' +
            '<option value=""' + (!props.strokeDasharray ? ' selected' : '') + '>实线</option>' +
            '<option value="5,5"' + (props.strokeDasharray === '5,5' ? ' selected' : '') + '>虚线</option></select></div></div>' +
            '</div>' +
            '<div class="props-actions">' +
            '<button type="submit" class="layui-btn" lay-submit lay-filter="saveProps">保存修改</button>' +
            '<button type="button" class="layui-btn layui-btn-danger" id="btn-delete">删除连线</button>' +
            '</div></form>';
        form.render();

        colorpicker.render({ elem: '#edge-stroke-color', color: props.stroke || '#333333', done: function (c) { lf.setProperties(data.id, { stroke: c }); } });
        colorpicker.render({ elem: '#edge-text-color', color: props.textColor || props.stroke || '#333333', done: function (c) { lf.setProperties(data.id, { textColor: c }); } });
        document.getElementById('btn-delete').onclick = function () { lf.deleteEdge(currentElementId); clearPanel(); };
        // 连线文本实时同步
        var edgeTextInput = document.querySelector('input[name="text"]');
        if (edgeTextInput) {
            edgeTextInput.addEventListener('input', function () {
                lf.updateText(data.id, this.value);
            });
        }
        // 文本位置实时同步
        form.on('select(textPosition)', function (obj) {
            var pos = obj.value;
            lf.setProperties(data.id, { textPosition: pos });
            var eModel = lf.graphModel.getEdgeModelById(data.id);
            if (eModel && eModel.text) {
                var sp = eModel.startPoint, ep = eModel.endPoint;
                var ratio = pos === 'start' ? 0.15 : pos === 'end' ? 0.85 : 0.5;
                eModel.text = { value: eModel.text.value, x: sp.x + (ep.x - sp.x) * ratio, y: sp.y + (ep.y - sp.y) * ratio };
            }
        });
        // 线条类型实时切换
        form.on('select(edgeType)', function (obj) {
            var newType = obj.value;
            var curModel = lf.graphModel.getEdgeModelById(data.id);
            if (curModel && curModel.type !== newType) {
                var oldData = curModel.getData();
                lf.deleteEdge(data.id);
                lf.addEdge({
                    id: oldData.id, type: newType,
                    sourceNodeId: oldData.sourceNodeId, targetNodeId: oldData.targetNodeId,
                    sourceAnchorId: oldData.sourceAnchorId, targetAnchorId: oldData.targetAnchorId,
                    text: oldData.text, properties: oldData.properties || {},
                });
                lf.selectElementById(data.id, true);
            }
        });
        // 线条粗细实时同步
        form.on('select(strokeWidth)', function (obj) {
            var val = parseInt(obj.value);
            var eModel = lf.graphModel.getEdgeModelById(data.id);
            if (eModel) {
                eModel.style = Object.assign({}, eModel.style, { strokeWidth: val });
                lf.setProperties(data.id, { strokeWidth: val });
            }
        });
        // 线条样式实时同步
        form.on('select(strokeDasharray)', function (obj) {
            var val = obj.value;
            var eModel = lf.graphModel.getEdgeModelById(data.id);
            if (eModel) {
                eModel.style = Object.assign({}, eModel.style, { strokeDasharray: val });
                lf.setProperties(data.id, { strokeDasharray: val });
            }
        });
    }

    function renderBlankPanel() {
        currentElementId = null; currentElementType = null;
        document.getElementById('props-content').innerHTML =
            '<div class="empty-tip"><i class="layui-icon layui-icon-set"></i>请在画布中选中节点或连线<br>以配置详细属性</div>' +
            '<div class="props-help">' +
            '<div class="props-help-title">快捷操作</div>' +
            '<div class="props-help-item"><span>撤销</span><kbd>Ctrl</kbd>+<kbd>Z</kbd></div>' +
            '<div class="props-help-item"><span>重做</span><kbd>Ctrl</kbd>+<kbd>Y</kbd></div>' +
            '<div class="props-help-item"><span>删除选中</span><kbd>Delete</kbd></div>' +
            '<div class="props-help-item"><span>编辑文字</span><span style="color:#9ca3af">双击节点/连线</span></div>' +
            '<div class="props-help-btn"><button type="button" class="layui-btn layui-btn-fluid layui-btn-primary layui-btn-sm" id="btn-clear">清空画布</button></div>' +
            '</div>';
        form.render();
        document.getElementById('btn-clear').onclick = function () {
            layer.confirm('确定要清空整个画布吗？', { icon: 3 }, function (i) { lf.clearData(); clearPanel(); updateEmptyState(); layer.close(i); });
        };
    }

    function clearPanel() {
        currentElementId = null; currentElementType = null;
        document.getElementById('props-content').innerHTML = '<div class="empty-tip"><i class="layui-icon layui-icon-set"></i>请在画布中选中节点或连线<br>以配置详细属性</div>';
    }

    // ========== 事件监听 ==========
    lf.on('node:click', function (arg) {
        renderNodePanel(arg.data);
    });
    lf.on('edge:click', function (arg) { renderEdgePanel(arg.data); });
    lf.on('blank:click', function () { renderBlankPanel(); });
    lf.on('node:delete', function () { clearPanel(); updateEmptyState(); });
    lf.on('edge:delete', function () { clearPanel(); updateEmptyState(); });
    // 拖拽添加/复制粘贴节点后，自动将属性面板切换到新节点
    lf.on('node:dnd-add', function (arg) {
        renderNodePanel(arg.data);
    });
    lf.on('node:add', function (arg) {
        renderNodePanel(arg.data);
    });
    // 点击节点文字时也显示属性面板（文字层可能拦截了 node:click 事件）
    var graphContainer = document.getElementById('graph');
    if (graphContainer) {
        graphContainer.addEventListener('click', function (e) {
            var target = e.target;
            var isTextClick = target.tagName === 'text' || target.tagName === 'tspan';
            if (!isTextClick) return;
            // 通过点击坐标找到对应的节点
            var point = lf.getPointByClient(e.clientX, e.clientY);
            var canvasX = point.canvasOverlayPosition.x;
            var canvasY = point.canvasOverlayPosition.y;
            var nodes = lf.graphModel.nodes;
            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i];
                var hw = n.width / 2, hh = n.height / 2;
                if (canvasX >= n.x - hw && canvasX <= n.x + hw && canvasY >= n.y - hh && canvasY <= n.y + hh) {
                    renderNodePanel(n.getData());
                    break;
                }
            }
        });
    }
    // 表单提交
    form.on('submit(saveProps)', function (obj) {
        var f = obj.field;
        if (currentElementType === 'node') {
            lf.updateText(currentElementId, f.text);
            // 获取选中模块的完整信息，以对象形式保存
            var $sel = $('#props-content select[name="module"]');
            var $opt = $sel.find('option:selected');
            var moduleInfo = {
                Id: parseInt(f.module) || 0,
                Flag: parseInt($opt.attr('data-flag')) || 0,
                SectionId: parseInt($opt.attr('data-sectionid')) || 0,
                Name: $opt.attr('data-name') || ''
            };
            lf.setProperties(currentElementId, { owner: f.owner, desc: f.desc, textColor: currentNodeTextColor, moduleInfo: moduleInfo });
        } else if (currentElementType === 'edge') {
            lf.updateText(currentElementId, f.text);
            var needReselect = false;
            if (f.edgeType) {
                var curModel = lf.graphModel.getEdgeModelById(currentElementId);
                if (curModel && curModel.type !== f.edgeType) {
                    var oldData = curModel.getData();
                    lf.deleteEdge(currentElementId);
                    lf.addEdge({
                        id: oldData.id, type: f.edgeType,
                        sourceNodeId: oldData.sourceNodeId, targetNodeId: oldData.targetNodeId,
                        sourceAnchorId: oldData.sourceAnchorId, targetAnchorId: oldData.targetAnchorId,
                        text: oldData.text, properties: oldData.properties || {},
                    });
                    needReselect = true;
                }
            }
            lf.setProperties(currentElementId, { strokeWidth: parseInt(f.strokeWidth), strokeDasharray: f.strokeDasharray, textPosition: f.textPosition });
            var edgeModel = lf.graphModel.getEdgeModelById(currentElementId);
            if (edgeModel && edgeModel.text) {
                var sp = edgeModel.startPoint, ep = edgeModel.endPoint;
                var ratio = 0.5;
                if (f.textPosition === 'start') ratio = 0.15;
                else if (f.textPosition === 'end') ratio = 0.85;
                edgeModel.text = { value: edgeModel.text.value, x: sp.x + (ep.x - sp.x) * ratio, y: sp.y + (ep.y - sp.y) * ratio };
            }
            if (needReselect) lf.selectElementById(currentElementId, true);
        }
        layer.msg('保存成功', { icon: 1, time: 1000 });
        return false;
    });

    // ========== 顶部按钮 ==========
    // 保存按钮
    var btnSave = document.getElementById('btn-save');
    if (btnSave) btnSave.onclick = function () {
        var data = lf.getGraphData();
        var transform = lf.getTransform();
        data.transform = { SCALE_X: transform.SCALE_X, SCALE_Y: transform.SCALE_Y, TRANSLATE_X: transform.TRANSLATE_X, TRANSLATE_Y: transform.TRANSLATE_Y };
        if (!data.nodes || data.nodes.length === 0) return layer.msg('画布为空，无法保存！', { icon: 2 });
        if (!currentGroupId) return layer.msg('请先选择一个导航分组！', { icon: 2 });
        layer.confirm('确定要保存当前导航图吗？', { icon: 3, title: '保存确认' }, function (index) {
            layer.close(index);
            var jsonStr = JSON.stringify(data);
            $.ajax({
                type: 'POST', url: '/Common/Ashx/Common_Nav.ashx',
                data: { act: 'Save_Desktop_Navigator_DiagramDataNew', moduleGroupId: currentGroupId, roleId: '', data: jsonStr },
                success: function () { layer.msg('保存成功！', { icon: 1, time: 2000 }); },
                error: function () { layer.msg('保存失败!', { icon: 1, time: 2000 }); }
            });
        });
    };


    // ========== 画布工具栏按钮 ==========
    var ctbUndo = document.getElementById('ctb-undo');
    var ctbRedo = document.getElementById('ctb-redo');
    if (ctbUndo) ctbUndo.onclick = function () { lf.undo(); };
    if (ctbRedo) ctbRedo.onclick = function () { lf.redo(); };
    var ctbZoomIn = document.getElementById('ctb-zoom-in');
    var ctbZoomOut = document.getElementById('ctb-zoom-out');
    var ctbFit = document.getElementById('ctb-fit');
    var ctbReset = document.getElementById('ctb-reset');
    if (ctbZoomIn) ctbZoomIn.onclick = function () { lf.zoom(true); };
    if (ctbZoomOut) ctbZoomOut.onclick = function () { lf.zoom(false); };
    if (ctbFit) ctbFit.onclick = function () { lf.fitView(80); };
    if (ctbReset) ctbReset.onclick = function () { lf.resetZoom(); };
    // 框选按钮
    var ctbSelect = document.getElementById('ctb-select');
    if (ctbSelect) {
        ctbSelect.onclick = function () {
            if (!lf.openSelectionSelect) return layer.msg('框选插件未加载', { icon: 2 });
            var isActive = this.classList.contains('tb-active');
            if (isActive) {
                lf.closeSelectionSelect();
                this.classList.remove('tb-active');
                this.title = '框选';
            } else {
                lf.openSelectionSelect();
                this.classList.add('tb-active');
                this.title = '取消框选';
            }
        };
    }
    // 小地图（默认显示）
    var miniMapVisible = false;
    var ctbMinimap = document.getElementById('ctb-minimap');
    if (ctbMinimap) {
        ctbMinimap.classList.add('active'); // 初始高亮
        ctbMinimap.onclick = function () {
            if (!lf.extension || !lf.extension.miniMap) {
                return layer.msg('小地图插件未加载', { icon: 2 });
            }
            if (miniMapVisible) {
                lf.extension.miniMap.hide(); miniMapVisible = false;
                this.classList.remove('active');
            } else {
                lf.extension.miniMap.show(); miniMapVisible = true;
                this.classList.add('active');
            }
        };
    }

    // 边类型切换
    var ctbEdgeType = document.getElementById('ctb-edge-type');
    if (ctbEdgeType) ctbEdgeType.onchange = function () { lf.setDefaultEdgeType(this.value); };

    // 导出 JSON
    var ctbExport = document.getElementById('ctb-export');
    if (ctbExport) ctbExport.onclick = function () {
        var data = lf.getGraphData();
        layer.open({
            type: 1, title: '导出 JSON 数据', area: ['650px', '450px'],
            content: '<pre style="padding:15px; height:380px; overflow:auto; background:#f8f8f8; font-size:12px;">' + JSON.stringify(data, null, 2) + '</pre>'
        });
    };
    // 保存
    var ctbSave = document.getElementById('ctb-save');
    if (ctbSave) ctbSave.onclick = function () {
        var data = lf.getGraphData();
        // 保存当前画布缩放和平移位置
        var transform = lf.getTransform();
        data.transform = { SCALE_X: transform.SCALE_X, SCALE_Y: transform.SCALE_Y, TRANSLATE_X: transform.TRANSLATE_X, TRANSLATE_Y: transform.TRANSLATE_Y };
        if (!data.nodes || data.nodes.length === 0) return layer.msg('画布为空，无法保存！', { icon: 2 });
        var unassignedNodes = [];
        for (var i = 0; i < data.nodes.length; i++) {
            var node = data.nodes[i], props = node.properties || {};
            var mi = props.moduleInfo || {};
            if (!mi.Id && (!props.module || props.module === '')) unassignedNodes.push((node.text && node.text.value) || node.id);
        }
        //if (unassignedNodes.length > 0) return layer.msg('以下节点未分配模块：' + unassignedNodes.join('、'), { icon: 2, time: 5000 });
        if (!currentGroupId) return layer.msg('请先选择一个导航分组！', { icon: 2 });
        layer.confirm('确定要保存当前导航图吗？', { icon: 3, title: '保存确认' }, function (index) {
            layer.close(index);
            var jsonStr = JSON.stringify(data);
            $.ajax({
                type: 'POST', url: '/Common/Ashx/Common_Nav.ashx',
                data: { act: 'Save_Desktop_Navigator_DiagramDataNew', moduleGroupId: currentGroupId, roleId: '', data: jsonStr },
                success: function () { layer.msg('保存成功！', { icon: 1, time: 2000 }); },
                error: function () { layer.msg('保存失败!', { icon: 1, time: 2000 }); }
            });
        });
    };

    // 左右面板折叠
    var rightPanel = document.getElementById('right-panel');
    var toggleRightBtn = document.getElementById('toggle-right');

    if (toggleRightBtn) {
        toggleRightBtn.onclick = function () {
            rightPanel.classList.toggle('collapsed');
            var isCollapsed = rightPanel.classList.contains('collapsed');
            toggleRightBtn.innerHTML = isCollapsed ? '<i class="layui-icon layui-icon-left"></i>' : '<i class="layui-icon layui-icon-right"></i>';
            setTimeout(function () { lf.resize(); }, 300);
        };
    }

    // 全屏（如存在）
    var btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) btnFullscreen.onclick = function () { document.body.classList.toggle('fullscreen-mode'); lf.resize(); };


    // 导出图片
    var ctbSnapshot = document.getElementById('ctb-snapshot');
    if (ctbSnapshot) ctbSnapshot.onclick = function () {
        layer.msg('正在生成图片...', { icon: 16, shade: 0.1, time: 0 });
        html2canvas(document.querySelector('#graph'), { backgroundColor: '#fafafa', useCORS: true, scale: 2 }).then(function (canvas) {
            var link = document.createElement('a');
            link.download = 'navigator-' + new Date().getTime() + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            layer.closeAll();
            layer.msg('图片导出成功', { icon: 1 });
        }).catch(function (err) {
            layer.closeAll();
            layer.msg('图片导出失败', { icon: 2 });
            console.error('[Navigator] 导出图片失败:', err);
        });
    };

    // 窗口自适应
    window.addEventListener('resize', function () { lf.resize(); });

    // ========== 右键菜单 ==========
    var menu = document.getElementById('context-menu');
    graphEl.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        if (currentElementId) {
            menu.style.display = 'block'; menu.style.left = e.clientX + 'px'; menu.style.top = e.clientY + 'px';
        } else { menu.style.display = 'none'; }
    });
    document.addEventListener('click', function () { menu.style.display = 'none'; });

    var menuEdit = document.getElementById('menu-edit');
    var menuDelete = document.getElementById('menu-delete');
    if (menuEdit) menuEdit.onclick = function () {
        if (currentElementType === 'node') { var d = lf.getNodeDataById(currentElementId); if (d) renderNodePanel(d); }
        else if (currentElementType === 'edge') { var d = lf.getEdgeDataById(currentElementId); if (d) renderEdgePanel(d); }
        menu.style.display = 'none';
    };
    if (menuDelete) menuDelete.onclick = function () {
        if (currentElementType === 'node') lf.deleteNode(currentElementId);
        else if (currentElementType === 'edge') lf.deleteEdge(currentElementId);
        clearPanel(); menu.style.display = 'none';
    };

    // ========== 初始化 ==========
    loadGroupList();
});
