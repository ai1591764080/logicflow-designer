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

  // ========== 初始化 LogicFlow ==========
  var container = document.querySelector('#graph');
  var lf = new LogicFlow({
    container: container,
    width: container.clientWidth || 800,
    height: container.clientHeight || 600,
    grid: { size: 10, visible: true, type: 'dot', config: { color: '#e0e0e0', thickness: 1 } },
    keyboard: { enabled: true },
    edgeType: 'custom-polyline',
    stopScrollGraph: true,
    stopZoomGraph: false,
    adjustEdge: true,
  });

  // ========== 自定义节点样式工具函数 ==========
  function applyNodeStyle(model, style, defaultFill, defaultStroke) {
    var props = model.properties || {};
    style.fill = props.fill || defaultFill;
    style.stroke = props.stroke || defaultStroke;
    style.strokeWidth = props.strokeWidth ? parseInt(props.strokeWidth) : 2;
    return style;
  }

  // ========== 注册自定义节点类型 (2.x ES6 class) ==========

  // 开始节点
  class StartNodeModel extends CircleNodeModel {
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#d9f0d3', '#52c41a'); }
  }
  lf.register({ type: 'start-node', view: CircleNode, model: StartNodeModel });

  // 结束节点
  class EndNodeModel extends CircleNodeModel {
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffd8d8', '#f5222d'); }
  }
  lf.register({ type: 'end-node', view: CircleNode, model: EndNodeModel });

  // 审批任务节点
  class UserTaskModel extends RectNodeModel {
    getNodeStyle() {
      var style = super.getNodeStyle();
      style.radius = 8;
      return applyNodeStyle(this, style, '#e6f7ff', '#1890ff');
    }
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
  }
  lf.register({ type: 'condition-node', view: DiamondNode, model: ConditionModel });

  // 基础矩形
  class BaseRectModel extends RectNodeModel {
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffffff', '#333333'); }
  }
  lf.register({ type: 'rect', view: RectNode, model: BaseRectModel });

  // 基础圆形
  class BaseCircleModel extends CircleNodeModel {
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffffff', '#333333'); }
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
  class CustomPolylineModel extends PolylineEdgeModel {
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
  }
  lf.register({ type: 'custom-polyline', view: PolylineEdge, model: CustomPolylineModel });

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

    document.getElementById('props-content').innerHTML =
      '<form class="layui-form" lay-filter="propsForm">' +
        '<div class="layui-form-item"><label class="layui-form-label">节点 ID</label><div class="layui-input-block"><input type="text" value="' + data.id + '" disabled class="layui-input layui-disabled"></div></div>' +
        '<div class="layui-form-item"><label class="layui-form-label">节点文本</label><div class="layui-input-block"><input type="text" name="text" value="' + textVal + '" class="layui-input"></div></div>' +
        '<div class="layui-form-item"><label class="layui-form-label">负责人</label><div class="layui-input-block"><input type="text" name="owner" value="' + (props.owner || '') + '" class="layui-input"></div></div>' +
        '<div class="layui-form-item"><label class="layui-form-label">描述</label><div class="layui-input-block"><textarea name="desc" class="layui-textarea">' + (props.desc || '') + '</textarea></div></div>' +
        '<hr style="border-color: #f0f0f0; margin: 20px 0;">' +
        '<div class="layui-form-item"><label class="layui-form-label">背景色</label><div class="layui-input-block"><div id="node-fill-color" style="margin-top: 5px;"></div></div></div>' +
        '<div class="layui-form-item"><label class="layui-form-label">边框色</label><div class="layui-input-block"><div id="node-stroke-color" style="margin-top: 5px;"></div></div></div>' +
        '<div class="layui-form-item" style="margin-top: 30px;"><div class="layui-input-block">' +
          '<button type="submit" class="layui-btn" lay-submit lay-filter="saveProps">保存修改</button>' +
          '<button type="button" class="layui-btn layui-btn-danger" id="btn-delete">删除</button>' +
        '</div></div>' +
      '</form>';
    form.render();

    colorpicker.render({ elem: '#node-fill-color', color: props.fill || colors.fill, done: function (c) { lf.setProperties(data.id, { fill: c }); } });
    colorpicker.render({ elem: '#node-stroke-color', color: props.stroke || colors.stroke, done: function (c) { lf.setProperties(data.id, { stroke: c }); } });

    document.getElementById('btn-delete').onclick = function () { lf.deleteNode(currentElementId); clearPanel(); };
  }

  function renderEdgePanel(data) {
    currentElementId = data.id;
    currentElementType = 'edge';
    var props = data.properties || {};
    var textVal = (data.text && data.text.value) || '';

    document.getElementById('props-content').innerHTML =
      '<form class="layui-form" lay-filter="propsForm">' +
        '<div class="layui-form-item"><label class="layui-form-label">连线文案</label><div class="layui-input-block"><input type="text" name="text" value="' + textVal + '" placeholder="如：同意、拒绝" class="layui-input"></div></div>' +
        '<div class="layui-form-item"><label class="layui-form-label">线条颜色</label><div class="layui-input-block"><div id="edge-stroke-color" style="margin-top: 5px;"></div></div></div>' +
        '<div class="layui-form-item"><label class="layui-form-label">文字颜色</label><div class="layui-input-block"><div id="edge-text-color" style="margin-top: 5px;"></div></div></div>' +
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
        '<div class="layui-form-item" style="margin-top: 30px;"><div class="layui-input-block">' +
          '<button type="submit" class="layui-btn" lay-submit lay-filter="saveProps">保存修改</button>' +
          '<button type="button" class="layui-btn layui-btn-danger" id="btn-delete">删除</button>' +
        '</div></div>' +
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
      '<form class="layui-form" lay-filter="propsForm">' +
        '<div class="layui-form-item"><label class="layui-form-label">显示网格</label><div class="layui-input-block"><input type="checkbox" name="grid" lay-skin="switch" lay-text="开|关" lay-filter="gridSwitch" checked></div></div>' +
        '<div class="layui-form-item" style="margin-top: 40px;"><div class="layui-input-block"><button type="button" class="layui-btn layui-btn-fluid layui-btn-primary" id="btn-clear">清空画布</button></div></div>' +
      '</form>' +
      '<div style="margin-top: 50px; color: #999; font-size: 12px; line-height: 1.8;">' +
        '<p><b>提示：</b> 双击节点或连线可直接编辑文字</p>' +
        '<p><b>快捷键：</b> Ctrl+Z 撤销 | Delete 删除</p>' +
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
      lf.setProperties(currentElementId, { owner: f.owner, desc: f.desc });
    } else if (currentElementType === 'edge') {
      lf.updateText(currentElementId, f.text);
      lf.setProperties(currentElementId, { strokeWidth: parseInt(f.strokeWidth), strokeDasharray: f.strokeDasharray });
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
