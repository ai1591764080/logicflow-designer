/**
 * 专业流程图设计器 - 核心逻辑
 * 依赖: LogicFlow 2.2.3 (CDN全局变量) + Layui + html2canvas
 */
layui.use(['layer', 'form', 'colorpicker'], function () {
  var layer = layui.layer,
    form = layui.form,
    colorpicker = layui.colorpicker;

  // 从全局 LogicFlow 对象获取节点/边基类 (2.x API)
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

  // ========== 初始化 LogicFlow ==========
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
        width: 150,
        height: 120,
        showEdge: true,
        isShowCloseIcon: true,
        rightPosition: 10,
        bottomPosition: 10
      }
    } : {},
  });

  // 设置边调整点样式，使其更醒目
  lf.setTheme({
    edgeAdjust: {
      r: 6,
      fill: '#1e9fff',
      stroke: '#fff',
      strokeWidth: 2,
      hover: { r: 8, fill: '#1890ff' }
    }
  });

  // ========== 自定义节点样式工具函数 ==========
  function applyNodeStyle(model, style, defaultFill, defaultStroke) {
    var props = model.properties || {};
    style.fill = props.fill || defaultFill;
    style.stroke = props.stroke || defaultStroke;
    style.strokeWidth = props.strokeWidth ? parseInt(props.strokeWidth) : 2;
    return style;
  }

  // 节点文本样式工具（读取 properties.textColor）
  function applyNodeTextStyle(model, style) {
    var props = model.properties || {};
    if (props.textColor) style.color = props.textColor;
    return style;
  }

  // ========== 注册自定义节点类型 (2.x ES6 class) ==========

  // 开始节点
  class StartNodeModel extends CircleNodeModel {
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#d9f0d3', '#52c41a'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'start-node', view: CircleNode, model: StartNodeModel });

  // 结束节点
  class EndNodeModel extends CircleNodeModel {
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffd8d8', '#f5222d'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'end-node', view: CircleNode, model: EndNodeModel });

  // 审批任务节点
  class UserTaskModel extends RectNodeModel {
    getNodeStyle() {
      var style = super.getNodeStyle();
      style.radius = 8;
      return applyNodeStyle(this, style, '#e6f7ff', '#1890ff');
    }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'user-task', view: RectNode, model: UserTaskModel });

  // 条件判断节点
  class ConditionModel extends DiamondNodeModel {
    initNodeData(data) {
      super.initNodeData(data);
      this.rx = (data.properties && data.properties.rx) || 50;
      this.ry = (data.properties && data.properties.ry) || 50;
    }
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#fffbe6', '#faad14'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'condition-node', view: DiamondNode, model: ConditionModel });

  // 基础矩形
  class BaseRectModel extends RectNodeModel {
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'rect', view: RectNode, model: BaseRectModel });

  // 基础圆形
  class BaseCircleModel extends CircleNodeModel {
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'circle', view: CircleNode, model: BaseCircleModel });

  // 基础菱形
  class BaseDiamondModel extends DiamondNodeModel {
    initNodeData(data) {
      super.initNodeData(data);
      this.rx = (data.properties && data.properties.rx) || 50;
      this.ry = (data.properties && data.properties.ry) || 50;
    }
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'diamond', view: DiamondNode, model: BaseDiamondModel });

  // ========== 新增基础图形 ==========

  // 长方形（明显宽大于高，小圆角）
  class OblongModel extends RectNodeModel {
    initNodeData(data) {
      super.initNodeData(data);
      this.width = 160;
      this.height = 50;
      this.radius = 4;
    }
    setAttributes() {
      this.width = 160;
      this.height = 50;
    }
    getNodeStyle() {
      var style = super.getNodeStyle();
      style.radius = 4;
      return applyNodeStyle(this, style, '#ffffff', '#333333');
    }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'oblong', view: RectNode, model: OblongModel });

  // 直角长方形（完全直角、中等尺寸）
  class SharpRectModel extends RectNodeModel {
    initNodeData(data) {
      super.initNodeData(data);
      this.width = 160;
      this.height = 70;
      this.radius = 0;
    }
    setAttributes() {
      this.width = 160;
      this.height = 70;
      this.radius = 0;
    }
    getNodeStyle() {
      var style = super.getNodeStyle();
      style.radius = 0;
      return applyNodeStyle(this, style, '#ffffff', '#333333');
    }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'sharp-rect', view: RectNode, model: SharpRectModel });

  // 圆角长方形（大圆角、中等尺寸）
  class RoundRectModel extends RectNodeModel {
    initNodeData(data) {
      super.initNodeData(data);
      this.width = 160;
      this.height = 70;
      this.radius = 25;
    }
    setAttributes() {
      this.width = 160;
      this.height = 70;
      this.radius = 25;
    }
    getNodeStyle() {
      var style = super.getNodeStyle();
      style.radius = 25;
      return applyNodeStyle(this, style, '#ffffff', '#333333');
    }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'round-rect', view: RectNode, model: RoundRectModel });

  // ========== 新增流程图标准图形 ==========

  // 文档（Document）- 底部有波浪线的矩形
  class DocumentModel extends RectNodeModel {
    initNodeData(data) {
      super.initNodeData(data);
      this.width = 140;
      this.height = 80;
    }
    setAttributes() {
      this.width = 140;
      this.height = 80;
    }
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  
  class DocumentView extends RectNode {
    getShape() {
      const { x, y, width, height } = this.props.model;
      const style = this.props.model.getNodeStyle();
      const w = width, ht = height;
      const bottomY = y + ht / 2;
      const amp = 12; // 侧S形振幅
      // 底部侧S形：左半段先向外凸（下弯），右半段再向内凹（上弯）
      const pathD = `M ${x - w/2} ${y - ht/2}
        L ${x + w/2} ${y - ht/2}
        L ${x + w/2} ${bottomY}
        C ${x + w/6} ${bottomY - amp}, ${x + w/6} ${bottomY - amp}, ${x} ${bottomY}
        C ${x - w/6} ${bottomY + amp}, ${x - w/6} ${bottomY + amp}, ${x - w/2} ${bottomY}
        Z`;
      return h('g', {}, [
        h('path', {
          d: pathD,
          fill: style.fill,
          stroke: style.stroke,
          strokeWidth: style.strokeWidth || 2
        })
      ]);
    }
  }
  lf.register({ type: 'document', view: DocumentView, model: DocumentModel });

  // 子流程（Subprocess）- 左右两侧有竖线的矩形
  class SubprocessModel extends RectNodeModel {
    initNodeData(data) {
      super.initNodeData(data);
      this.width = 160;
      this.height = 70;
    }
    setAttributes() {
      this.width = 160;
      this.height = 70;
    }
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  
  class SubprocessView extends RectNode {
    getShape() {
      const { x, y, width, height } = this.props.model;
      const props = this.props.model.properties || {};
      const style = this.props.model.getNodeStyle();
      
      return h('g', {}, [
        // 主矩形
        h('rect', {
          x: x - width/2,
          y: y - height/2,
          width: width,
          height: height,
          fill: style.fill,
          stroke: style.stroke,
          strokeWidth: style.strokeWidth || 2
        }),
        // 左侧竖线（距左边约30px）
        h('line', {
          x1: x - width/2 + 30,
          y1: y - height/2,
          x2: x - width/2 + 30,
          y2: y + height/2,
          stroke: style.stroke,
          strokeWidth: style.strokeWidth || 2
        }),
        // 右侧竖线（距右边约30px）
        h('line', {
          x1: x + width/2 - 30,
          y1: y - height/2,
          x2: x + width/2 - 30,
          y2: y + height/2,
          stroke: style.stroke,
          strokeWidth: style.strokeWidth || 2
        })
      ]);
    }
  }
  lf.register({ type: 'subprocess', view: SubprocessView, model: SubprocessModel });

  // 内部存储（Internal Storage）- 顶部和左侧有分隔线的矩形
  class InternalStorageModel extends RectNodeModel {
    initNodeData(data) {
      super.initNodeData(data);
      this.width = 160;
      this.height = 70;
    }
    setAttributes() {
      this.width = 160;
      this.height = 70;
    }
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  
  class InternalStorageView extends RectNode {
    getShape() {
      const { x, y, width, height } = this.props.model;
      const props = this.props.model.properties || {};
      const style = this.props.model.getNodeStyle();
      
      return h('g', {}, [
        // 主矩形
        h('rect', {
          x: x - width/2,
          y: y - height/2,
          width: width,
          height: height,
          fill: style.fill,
          stroke: style.stroke,
          strokeWidth: style.strokeWidth || 2
        }),
        // 顶部横线
        h('line', {
          x1: x - width/2,
          y1: y - height/2 + 10,
          x2: x + width/2,
          y2: y - height/2 + 10,
          stroke: style.stroke,
          strokeWidth: style.strokeWidth || 2
        }),
        // 左侧竖线
        h('line', {
          x1: x - width/2 + 20,
          y1: y - height/2,
          x2: x - width/2 + 20,
          y2: y + height/2,
          stroke: style.stroke,
          strokeWidth: style.strokeWidth || 2
        })
      ]);
    }
  }
  lf.register({ type: 'internal-storage', view: InternalStorageView, model: InternalStorageModel });

  // ========== 注册自定义连线类型 ==========

  // 公共边样式混入
  function edgeStyleMixin(BaseModel) {
    return class extends BaseModel {
      initNodeData(data) {
        super.initNodeData(data);
        this.customTextPosition = true;
      }
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
        style.background = { fill: '#fff', stroke: '#e6e6e6', radius: 2 };
        return style;
      }
      getTextPosition() {
        var props = this.properties || {};
        var pos = props.textPosition;
        if (!pos || pos === 'middle') return super.getTextPosition();
        var sp = this.startPoint;
        var ep = this.endPoint;
        if (pos === 'start') {
          return { x: sp.x + (ep.x - sp.x) * 0.15, y: sp.y + (ep.y - sp.y) * 0.15 };
        } else if (pos === 'end') {
          return { x: sp.x + (ep.x - sp.x) * 0.85, y: sp.y + (ep.y - sp.y) * 0.85 };
        }
        return super.getTextPosition();
      }
    };
  }

  // 贝塞尔曲线
  class CustomBezierModel extends edgeStyleMixin(BezierEdgeModel) {}
  lf.register({ type: 'custom-bezier', view: BezierEdge, model: CustomBezierModel });

  // 直角折线
  class CustomPolylineModel extends edgeStyleMixin(PolylineEdgeModel) {}
  lf.register({ type: 'custom-polyline', view: PolylineEdge, model: CustomPolylineModel });

  // 直线
  class CustomLineModel extends edgeStyleMixin(LineEdgeModel) {}
  lf.register({ type: 'custom-line', view: LineEdge, model: CustomLineModel });

  // 渲染空画布
  lf.render({ nodes: [], edges: [] });
  
  // 确保画布尺寸正确
  setTimeout(function() {
    lf.resize();
  }, 100);

  // 暴露实例供外部调用
  window.lf = lf;

  // ========== 拖拽添加节点 ==========
  document.querySelectorAll('.node-item').forEach(function (item) {
    item.addEventListener('dragstart', function (e) {
      e.dataTransfer.setData('type', this.getAttribute('data-type'));
    });
  });

  var graphEl = document.getElementById('graph');
  var lastMouseX = 0, lastMouseY = 0;

  // 全局记录鼠标位置，防止 SVG 元素拦截事件导致坐标丢失
  document.addEventListener('dragover', function (e) {
    e.preventDefault();
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });

  graphEl.addEventListener('drop', function (e) {
    e.preventDefault();
    e.stopPropagation();
    var type = e.dataTransfer.getData('type');
    if (!type) return;

    // 使用全局记录的精准坐标
    var clientX = lastMouseX || e.clientX;
    var clientY = lastMouseY || e.clientY;

    // 将浏览器坐标转换为画布坐标
    var point = lf.getPointByClient(clientX, clientY);
    var x = point.canvasOverlayPosition.x;
    var y = point.canvasOverlayPosition.y;

    var textMap = {
      'start-node': '开始', 'end-node': '结束', 'user-task': '审批任务', 'condition-node': '条件判断',
      'rect': '矩形', 'oblong': '长方形', 'sharp-rect': '直角长方形', 'round-rect': '圆角长方形',
      'document': '文档', 'subprocess': '子流程', 'internal-storage': '内部存储',
      'circle': '圆形', 'diamond': '菱形'
    };

    lf.addNode({
      type: type,
      x: x,
      y: y,
      text: { value: textMap[type] || '新节点', x: x, y: y },
      properties: { owner: '', desc: '', fill: '', stroke: '', strokeWidth: '', rx: 50, ry: 50 }
    });

    lastMouseX = 0;
    lastMouseY = 0;
  });

  // ========== 属性面板逻辑 ==========
  var currentElementId = null, currentElementType = null;
  var currentNodeTextColor = ''; // 跟踪当前节点字体颜色（颜色选择器实时更新）

  var defaultColors = {
    'start-node': { fill: '#d9f0d3', stroke: '#52c41a' },
    'end-node': { fill: '#ffd8d8', stroke: '#f5222d' },
    'user-task': { fill: '#e6f7ff', stroke: '#1890ff' },
    'condition-node': { fill: '#fffbe6', stroke: '#faad14' },
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
    var colors = defaultColors[data.type] || { fill: '#ffffff', stroke: '#333333' };
    var textVal = (data.text && data.text.value) || '';
    var moduleVal = props.module || '2001';

    document.getElementById('props-content').innerHTML =
      '<form class="layui-form" lay-filter="propsForm">' +
        // 基本信息区
        '<div class="props-section">' +
          '<div class="props-section-title">基本信息</div>' +
          '<div class="layui-form-item"><label class="layui-form-label">节点 ID</label><div class="layui-input-block"><input type="text" value="' + data.id + '" disabled class="layui-input layui-disabled"></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">节点文本</label><div class="layui-input-block"><input type="text" name="text" value="' + textVal + '" class="layui-input"></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">所属模块</label><div class="layui-input-block">' +
            '<select name="module">' +
              '<option value="2001"' + (moduleVal === '2001' ? ' selected' : '') + '>通用流程</option>' +
              '<option value="2002"' + (moduleVal === '2002' ? ' selected' : '') + '>客户管理</option>' +
              '<option value="2003"' + (moduleVal === '2003' ? ' selected' : '') + '>订单处理</option>' +
              '<option value="2004"' + (moduleVal === '2004' ? ' selected' : '') + '>财务审批</option>' +
            '</select>' +
          '</div></div>' +
        '</div>' +
        // 详细描述区
        '<div class="props-section">' +
          '<div class="props-section-title">详细描述</div>' +
          '<div class="layui-form-item"><label class="layui-form-label">负责人</label><div class="layui-input-block"><input type="text" name="owner" value="' + (props.owner || '') + '" placeholder="请输入负责人" class="layui-input"></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">描述</label><div class="layui-input-block"><textarea name="desc" placeholder="请输入节点描述">' + (props.desc || '') + '</textarea></div></div>' +
        '</div>' +
        // 外观样式区
        '<div class="props-section">' +
          '<div class="props-section-title">外观样式</div>' +
          '<div class="layui-form-item"><label class="layui-form-label">背景色</label><div class="layui-input-block"><div class="color-field" id="node-fill-color"></div></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">边框色</label><div class="layui-input-block"><div class="color-field" id="node-stroke-color"></div></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">字体色</label><div class="layui-input-block"><div class="color-field" id="node-text-color"></div></div></div>' +
        '</div>' +
        // 操作按钮区
        '<div class="props-actions">' +
          '<button type="submit" class="layui-btn" lay-submit lay-filter="saveProps">保存修改</button>' +
          '<button type="button" class="layui-btn layui-btn-danger" id="btn-delete">删除节点</button>' +
        '</div>' +
      '</form>';
    form.render();

    colorpicker.render({ elem: '#node-fill-color', color: props.fill || colors.fill, done: function (c) { lf.setProperties(data.id, { fill: c }); } });
    colorpicker.render({ elem: '#node-stroke-color', color: props.stroke || colors.stroke, done: function (c) { lf.setProperties(data.id, { stroke: c }); } });
    currentNodeTextColor = props.textColor || '#333333';
    colorpicker.render({ elem: '#node-text-color', color: currentNodeTextColor, done: function (c) { currentNodeTextColor = c; lf.setProperties(data.id, { textColor: c }); } });

    document.getElementById('btn-delete').onclick = function () { lf.deleteNode(currentElementId); clearPanel(); };
  }

  function renderEdgePanel(data) {
    currentElementId = data.id;
    currentElementType = 'edge';
    var props = data.properties || {};
    var textVal = (data.text && data.text.value) || '';

    document.getElementById('props-content').innerHTML =
      '<form class="layui-form" lay-filter="propsForm">' +
        // 文本信息区
        '<div class="props-section">' +
          '<div class="props-section-title">文本信息</div>' +
          '<div class="layui-form-item"><label class="layui-form-label">连线文案</label><div class="layui-input-block"><input type="text" name="text" value="' + textVal + '" placeholder="如：同意、拒绝" class="layui-input"></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">文本位置</label><div class="layui-input-block">' +
            '<select name="textPosition">' +
              '<option value="start"' + (props.textPosition === 'start' ? ' selected' : '') + '>起点附近</option>' +
              '<option value="middle"' + (!props.textPosition || props.textPosition === 'middle' ? ' selected' : '') + '>中间位置</option>' +
              '<option value="end"' + (props.textPosition === 'end' ? ' selected' : '') + '>终点附近</option>' +
            '</select>' +
          '</div></div>' +
        '</div>' +
        // 线条样式区
        '<div class="props-section">' +
          '<div class="props-section-title">线条样式</div>' +
          '<div class="layui-form-item"><label class="layui-form-label">线条颜色</label><div class="layui-input-block"><div class="color-field" id="edge-stroke-color"></div></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">文字颜色</label><div class="layui-input-block"><div class="color-field" id="edge-text-color"></div></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">线条粗细</label><div class="layui-input-block">' +
            '<select name="strokeWidth">' +
              '<option value="1"' + (props.strokeWidth == 1 ? ' selected' : '') + '>1 px</option>' +
              '<option value="2"' + (!props.strokeWidth || props.strokeWidth == 2 ? ' selected' : '') + '>2 px</option>' +
              '<option value="3"' + (props.strokeWidth == 3 ? ' selected' : '') + '>3 px</option>' +
            '</select>' +
          '</div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">线条样式</label><div class="layui-input-block">' +
            '<select name="strokeDasharray">' +
              '<option value=""' + (!props.strokeDasharray ? ' selected' : '') + '>实线</option>' +
              '<option value="5,5"' + (props.strokeDasharray === '5,5' ? ' selected' : '') + '>虚线</option>' +
            '</select>' +
          '</div></div>' +
        '</div>' +
        // 操作按钮区
        '<div class="props-actions">' +
          '<button type="submit" class="layui-btn" lay-submit lay-filter="saveProps">保存修改</button>' +
          '<button type="button" class="layui-btn layui-btn-danger" id="btn-delete">删除连线</button>' +
        '</div>' +
      '</form>';
    form.render();

    colorpicker.render({ elem: '#edge-stroke-color', color: props.stroke || '#333333', done: function (c) { lf.setProperties(data.id, { stroke: c }); } });
    colorpicker.render({ elem: '#edge-text-color', color: props.textColor || props.stroke || '#333333', done: function (c) { lf.setProperties(data.id, { textColor: c }); } });

    document.getElementById('btn-delete').onclick = function () { lf.deleteEdge(currentElementId); clearPanel(); };
  }

  function renderBlankPanel() {
    currentElementId = null;
    currentElementType = null;

    document.getElementById('props-content').innerHTML =
      '<div class="empty-tip"><i class="layui-icon layui-icon-set"></i>请在画布中选中节点或连线<br>以配置详细属性</div>' +
      '<div class="props-help">' +
        '<p><b>快捷操作</b></p>' +
        '<p><kbd>Ctrl</kbd>+<kbd>Z</kbd> 撤销 &nbsp; <kbd>Ctrl</kbd>+<kbd>Y</kbd> 重做</p>' +
        '<p><kbd>Delete</kbd> 删除选中元素</p>' +
        '<p>双击节点或连线可编辑文字</p>' +
        '<p style="margin-top:16px"><button type="button" class="layui-btn layui-btn-fluid layui-btn-primary layui-btn-sm" id="btn-clear" style="border-radius:6px;">清空画布</button></p>' +
      '</div>';
    form.render();
    document.getElementById('btn-clear').onclick = function () {
      layer.confirm('确定要清空整个画布吗？', { icon: 3 }, function (i) { lf.clearData(); clearPanel(); layer.close(i); });
    };
  }

  function clearPanel() {
    currentElementId = null;
    currentElementType = null;
    document.getElementById('props-content').innerHTML = '<div class="empty-tip"><i class="layui-icon layui-icon-set"></i>请在画布中选中节点或连线<br>以配置详细属性</div>';
  }

  // ========== 事件监听 ==========
  lf.on('node:click', function (arg) { renderNodePanel(arg.data); });
  lf.on('edge:click', function (arg) { renderEdgePanel(arg.data); });
  lf.on('blank:click', function () { renderBlankPanel(); });
  lf.on('node:delete', clearPanel);
  lf.on('edge:delete', clearPanel);

  // 表单提交
  form.on('submit(saveProps)', function (obj) {
    var f = obj.field;
    if (currentElementType === 'node') {
      lf.updateText(currentElementId, f.text);
      lf.setProperties(currentElementId, { owner: f.owner, desc: f.desc, textColor: currentNodeTextColor, module: f.module });
    } else if (currentElementType === 'edge') {
      lf.updateText(currentElementId, f.text);
      lf.setProperties(currentElementId, { strokeWidth: parseInt(f.strokeWidth), strokeDasharray: f.strokeDasharray, textPosition: f.textPosition });
      // 直接通过 model 修改文本坐标并触发重绘
      var edgeModel = lf.graphModel.getEdgeModelById(currentElementId);
      if (edgeModel && edgeModel.text) {
        var sp = edgeModel.startPoint;
        var ep = edgeModel.endPoint;
        var ratio = 0.5;
        if (f.textPosition === 'start') ratio = 0.15;
        else if (f.textPosition === 'end') ratio = 0.85;
        var newX = sp.x + (ep.x - sp.x) * ratio;
        var newY = sp.y + (ep.y - sp.y) * ratio;
        edgeModel.text = { value: edgeModel.text.value, x: newX, y: newY };
      }
    }
    layer.msg('保存成功', { icon: 1, time: 1000 });
    return false;
  });

  // 网格开关
  form.on('switch(gridSwitch)', function (d) {
    lf.setTheme({
      grid: d.elem.checked
        ? { size: 10, visible: true, type: 'dot', config: { color: '#e0e0e0', thickness: 1 } }
        : { visible: false }
    });
  });

  // ========== 工具栏按钮 ==========
  document.getElementById('btn-undo').onclick = function () { lf.undo(); };
  document.getElementById('btn-redo').onclick = function () { lf.redo(); };
  document.getElementById('btn-zoom-in').onclick = function () { lf.zoom(true); };
  document.getElementById('btn-zoom-out').onclick = function () { lf.zoom(false); };
  document.getElementById('btn-fit').onclick = function () { lf.fitView(80); };
  document.getElementById('btn-reset').onclick = function () { lf.resetZoom(); };
  document.getElementById('btn-fullscreen').onclick = function () { document.body.classList.toggle('fullscreen-mode'); lf.resize(); };

  // 边类型切换
  document.getElementById('edge-type-select').onchange = function () {
    lf.setDefaultEdgeType(this.value);
  };

  // 左右面板折叠
  var leftPanel = document.getElementById('left-panel');
  var rightPanel = document.getElementById('right-panel');
  var toggleLeftBtn = document.getElementById('toggle-left');
  var toggleRightBtn = document.getElementById('toggle-right');

  toggleLeftBtn.onclick = function () {
    leftPanel.classList.toggle('collapsed');
    var isCollapsed = leftPanel.classList.contains('collapsed');
    toggleLeftBtn.innerHTML = isCollapsed
      ? '<i class="layui-icon layui-icon-right"></i>'
      : '<i class="layui-icon layui-icon-left"></i>';
    setTimeout(function () { lf.resize(); }, 300);
  };
  toggleRightBtn.onclick = function () {
    rightPanel.classList.toggle('collapsed');
    var isCollapsed = rightPanel.classList.contains('collapsed');
    toggleRightBtn.innerHTML = isCollapsed
      ? '<i class="layui-icon layui-icon-left"></i>'
      : '<i class="layui-icon layui-icon-right"></i>';
    setTimeout(function () { lf.resize(); }, 300);
  };

  // 导出图片
  document.getElementById('btn-snapshot').onclick = function () {
    layer.msg('正在生成图片...', { icon: 16, shade: 0.1, time: 0 });
    html2canvas(document.querySelector('#graph'), { backgroundColor: '#fafafa' }).then(function (canvas) {
      var link = document.createElement('a');
      link.download = 'flowchart.png';
      link.href = canvas.toDataURL();
      link.click();
      layer.closeAll();
      layer.msg('图片导出成功', { icon: 1 });
    });
  };

  // 小地图开关
  var miniMapVisible = false;
  document.getElementById('btn-minimap').onclick = function () {
    if (!lf.extension || !lf.extension.miniMap) {
      return layer.msg('小地图插件未加载', { icon: 2 });
    }
    if (miniMapVisible) {
      lf.extension.miniMap.hide();
      miniMapVisible = false;
      this.classList.remove('layui-btn-warm');
      this.classList.add('layui-btn-primary');
    } else {
      lf.extension.miniMap.show();
      miniMapVisible = true;
      this.classList.remove('layui-btn-primary');
      this.classList.add('layui-btn-warm');
    }
  };

  // 导出 JSON
  document.getElementById('btn-export').onclick = function () {
    var data = lf.getGraphData();
    layer.open({
      type: 1, title: '导出 JSON 数据', area: ['650px', '450px'],
      content: '<pre style="padding:15px; height:380px; overflow:auto; background:#f8f8f8; font-size:12px;">' + JSON.stringify(data, null, 2) + '</pre>'
    });
  };

  // 校验流程
  document.getElementById('btn-validate').onclick = function () {
    var data = lf.getGraphData();
    if (!data.nodes || data.nodes.length === 0) return layer.msg('画布为空！', { icon: 2 });
    var starts = data.nodes.filter(function (n) { return n.type === 'start-node'; });
    var ends = data.nodes.filter(function (n) { return n.type === 'end-node'; });
    if (starts.length !== 1) return layer.msg('必须包含且仅包含一个【开始节点】！', { icon: 2 });
    if (ends.length !== 1) return layer.msg('必须包含且仅包含一个【结束节点】！', { icon: 2 });
    layer.msg('流程校验通过！', { icon: 1, time: 2000 });
  };

  // 保存发布
  document.getElementById('btn-save').onclick = function () {
    document.getElementById('btn-validate').click();
    console.log('提交:', lf.getGraphData());
  };

  // ========== 编辑模式 / 展示模式切换 ==========
  var isEditMode = true;
  var modeToggleBtn = document.getElementById('btn-mode-toggle');

  // 保存原始事件处理（用于恢复）
  var originalNodeClickHandler = null;
  var originalEdgeClickHandler = null;

  modeToggleBtn.onclick = function () {
    isEditMode = !isEditMode;
    if (isEditMode) {
      // 切换到编辑模式
      document.body.classList.remove('present-mode');
      this.innerHTML = '<i class="layui-icon layui-icon-read"></i> 展示模式';
      this.classList.remove('layui-btn-warm');
      this.classList.add('layui-btn-primary');
      // 恢复拖拽
      document.querySelectorAll('.node-item').forEach(function (item) {
        item.setAttribute('draggable', 'true');
      });
      // 恢复键盘
      lf.keyboard.enabled = true;
      // 恢复画布编辑能力
      lf.updateEditConfig({
        adjustEdge: true,
        adjustEdgeStartAndEnd: true,
        adjustNodePosition: true,
        hideAnchors: false,
        nodeTextEdit: true,
        edgeTextEdit: true,
        nodeTextDraggable: true,
        edgeTextDraggable: true,
        stopZoomGraph: false,
        stopMoveGraph: false,
      });
      layer.msg('已切换到编辑模式', { icon: 1, time: 1500 });
    } else {
      // 切换到展示模式
      document.body.classList.add('present-mode');
      this.innerHTML = '<i class="layui-icon layui-icon-edit"></i> 编辑模式';
      this.classList.remove('layui-btn-primary');
      this.classList.add('layui-btn-warm');
      // 禁用左侧拖拽
      document.querySelectorAll('.node-item').forEach(function (item) {
        item.setAttribute('draggable', 'false');
      });
      // 禁用键盘快捷键
      lf.keyboard.enabled = false;
      // 静默模式：禁止所有编辑操作
      lf.updateEditConfig({
        adjustEdge: false,           // 禁止调整线条
        adjustEdgeStartAndEnd: false, // 禁止调整线条端点
        adjustNodePosition: false,    // 禁止移动节点
        hideAnchors: true,            // 隐藏锚点
        nodeTextEdit: false,          // 禁止编辑节点文本
        edgeTextEdit: false,          // 禁止编辑线条文本
        nodeTextDraggable: false,     // 禁止拖动节点文本
        edgeTextDraggable: false,     // 禁止拖动线条文本
        stopZoomGraph: true,          // 禁止缩放
        stopMoveGraph: true,          // 禁止拖动画布
      });
      // 清空右侧面板
      clearPanel();
      layer.msg('已切换到展示模式', { icon: 1, time: 1500 });
    }
  };

  // 展示模式下节点点击事件（弹出提示）
  lf.on('node:click', function (arg) {
    if (!isEditMode) {
      var text = (arg.data.text && arg.data.text.value) || '未命名节点';
      var type = arg.data.type || 'unknown';
      var props = arg.data.properties || {};
      var info = '节点：' + text + '（类型：' + type + '）';
      if (props.owner) info += '\n负责人：' + props.owner;
      if (props.desc) info += '\n描述：' + props.desc;
      layer.msg(info, { icon: 0, time: 3000 });
    }
  });

  lf.on('edge:click', function (arg) {
    if (!isEditMode) {
      var text = (arg.data.text && arg.data.text.value) || '未命名连线';
      layer.msg('连线：' + text, { icon: 0, time: 2000 });
    }
  });

  // 窗口自适应
  window.addEventListener('resize', function () { lf.resize(); });

  // ========== 右键菜单 ==========
  var menu = document.getElementById('context-menu');
  graphEl.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    if (currentElementId) {
      menu.style.display = 'block';
      menu.style.left = e.clientX + 'px';
      menu.style.top = e.clientY + 'px';
    } else {
      menu.style.display = 'none';
    }
  });
  document.addEventListener('click', function () { menu.style.display = 'none'; });

  document.getElementById('menu-edit').onclick = function () {
    if (currentElementType === 'node') {
      var nodeData = lf.getNodeDataById(currentElementId);
      if (nodeData) renderNodePanel(nodeData);
    } else if (currentElementType === 'edge') {
      var edgeData = lf.getEdgeDataById(currentElementId);
      if (edgeData) renderEdgePanel(edgeData);
    }
    menu.style.display = 'none';
  };

  document.getElementById('menu-delete').onclick = function () {
    if (currentElementType === 'node') lf.deleteNode(currentElementId);
    else if (currentElementType === 'edge') lf.deleteEdge(currentElementId);
    clearPanel();
    menu.style.display = 'none';
  };
});
