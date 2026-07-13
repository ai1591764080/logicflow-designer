/**
 * 功能导航页 - 设计器 + 分组导航 + 基础图形
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
    return style;
  }
  function applyNodeTextStyle(model, style) {
    var props = model.properties || {};
    if (props.textColor) style.color = props.textColor;
    return style;
  }

  // ========== 初始化 LogicFlow（编辑模式） ==========
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
        rightPosition: 10, bottomPosition: 10
      }
    } : {},
  });

  lf.setTheme({
    edgeAdjust: {
      r: 6, fill: '#1e9fff', stroke: '#fff', strokeWidth: 2,
      hover: { r: 8, fill: '#1890ff' }
    }
  });

  // ========== 注册基础图形节点类型（无流程节点） ==========

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
    initNodeData(data) { super.initNodeData(data); this.rx = (data.properties && data.properties.rx) || 50; this.ry = (data.properties && data.properties.ry) || 50; }
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'diamond', view: DiamondNode, model: BaseDiamondModel });

  // 长方形
  class OblongModel extends RectNodeModel {
    initNodeData(data) { super.initNodeData(data); this.width = 160; this.height = 50; this.radius = 4; }
    setAttributes() { this.width = 160; this.height = 50; }
    getNodeStyle() { var s = super.getNodeStyle(); s.radius = 4; return applyNodeStyle(this, s, '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'oblong', view: RectNode, model: OblongModel });

  // 直角长方形
  class SharpRectModel extends RectNodeModel {
    initNodeData(data) { super.initNodeData(data); this.width = 160; this.height = 70; this.radius = 0; }
    setAttributes() { this.width = 160; this.height = 70; this.radius = 0; }
    getNodeStyle() { var s = super.getNodeStyle(); s.radius = 0; return applyNodeStyle(this, s, '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'sharp-rect', view: RectNode, model: SharpRectModel });

  // 圆角长方形
  class RoundRectModel extends RectNodeModel {
    initNodeData(data) { super.initNodeData(data); this.width = 160; this.height = 70; this.radius = 25; }
    setAttributes() { this.width = 160; this.height = 70; this.radius = 25; }
    getNodeStyle() { var s = super.getNodeStyle(); s.radius = 25; return applyNodeStyle(this, s, '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'round-rect', view: RectNode, model: RoundRectModel });

  // 文档
  class DocumentModel extends RectNodeModel {
    initNodeData(data) { super.initNodeData(data); this.width = 140; this.height = 80; }
    setAttributes() { this.width = 140; this.height = 80; }
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  class DocumentView extends RectNode {
    getShape() {
      const { x, y, width, height } = this.props.model;
      const style = this.props.model.getNodeStyle();
      const w = width, ht = height, bottomY = y + ht / 2, amp = 12;
      const pathD = `M ${x - w/2} ${y - ht/2} L ${x + w/2} ${y - ht/2} L ${x + w/2} ${bottomY} C ${x + w/6} ${bottomY - amp}, ${x + w/6} ${bottomY - amp}, ${x} ${bottomY} C ${x - w/6} ${bottomY + amp}, ${x - w/6} ${bottomY + amp}, ${x - w/2} ${bottomY} Z`;
      return h('g', {}, [h('path', { d: pathD, fill: style.fill, stroke: style.stroke, strokeWidth: style.strokeWidth || 2 })]);
    }
  }
  lf.register({ type: 'document', view: DocumentView, model: DocumentModel });

  // 子流程
  class SubprocessModel extends RectNodeModel {
    initNodeData(data) { super.initNodeData(data); this.width = 160; this.height = 70; }
    setAttributes() { this.width = 160; this.height = 70; }
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  class SubprocessView extends RectNode {
    getShape() {
      const { x, y, width, height } = this.props.model;
      const style = this.props.model.getNodeStyle();
      return h('g', {}, [
        h('rect', { x: x-width/2, y: y-height/2, width: width, height: height, fill: style.fill, stroke: style.stroke, strokeWidth: style.strokeWidth || 2 }),
        h('line', { x1: x-width/2+30, y1: y-height/2, x2: x-width/2+30, y2: y+height/2, stroke: style.stroke, strokeWidth: style.strokeWidth || 2 }),
        h('line', { x1: x+width/2-30, y1: y-height/2, x2: x+width/2-30, y2: y+height/2, stroke: style.stroke, strokeWidth: style.strokeWidth || 2 })
      ]);
    }
  }
  lf.register({ type: 'subprocess', view: SubprocessView, model: SubprocessModel });

  // 内部存储
  class InternalStorageModel extends RectNodeModel {
    initNodeData(data) { super.initNodeData(data); this.width = 160; this.height = 70; }
    setAttributes() { this.width = 160; this.height = 70; }
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  class InternalStorageView extends RectNode {
    getShape() {
      const { x, y, width, height } = this.props.model;
      const style = this.props.model.getNodeStyle();
      return h('g', {}, [
        h('rect', { x: x-width/2, y: y-height/2, width: width, height: height, fill: style.fill, stroke: style.stroke, strokeWidth: style.strokeWidth || 2 }),
        h('line', { x1: x-width/2, y1: y-height/2+10, x2: x+width/2, y2: y-height/2+10, stroke: style.stroke, strokeWidth: style.strokeWidth || 2 }),
        h('line', { x1: x-width/2+20, y1: y-height/2, x2: x-width/2+20, y2: y+height/2, stroke: style.stroke, strokeWidth: style.strokeWidth || 2 })
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
        style.background = { fill: '#fff', stroke: '#e6e6e6', radius: 2 };
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
  class CustomBezierModel extends edgeStyleMixin(BezierEdgeModel) {}
  lf.register({ type: 'custom-bezier', view: BezierEdge, model: CustomBezierModel });
  class CustomPolylineModel extends edgeStyleMixin(PolylineEdgeModel) {}
  lf.register({ type: 'custom-polyline', view: PolylineEdge, model: CustomPolylineModel });
  class CustomLineModel extends edgeStyleMixin(LineEdgeModel) {}
  lf.register({ type: 'custom-line', view: LineEdge, model: CustomLineModel });

  // 渲染空画布
  lf.render({ nodes: [], edges: [] });
  setTimeout(function() { lf.resize(); }, 100);
  window.lf = lf;

  // ========== 模块列表（远程加载） ==========
  var _moduleList = [];

  function getModules() {
    $.ajax({
      type: 'POST', url: '/Setting/UISolution/Ashx/CustomTopMenu.ashx', async: false,
      data: { act: 'GetAllChildMenu' },
      success: function (retData) {
        try { _moduleList = (typeof retData === 'string') ? JSON.parse(retData) : retData; } catch (e) { _moduleList = []; }
      },
      error: function () { _moduleList = []; }
    });
  }
  getModules();

  function buildModuleOptions(moduleVal) {
    var html = '';
    if (_moduleList.length === 0) { html += '<option value="">暂无模块</option>'; }
    for (var i = 0; i < _moduleList.length; i++) {
      var item = _moduleList[i];
      var selected = (String(item.Id) === String(moduleVal)) ? ' selected' : '';
      html += '<option value="' + item.Id + '" flag="' + item.Flag + '"' + selected + '>' + item.Name + '</option>';
    }
    return html;
  }

  // ========== 导航分组 ==========
  var _groupList = [];
  var currentGroupId = null;

  function getGroupList() {
    var list = [];
    $.ajax({
      type: 'POST', url: '/Common/Ashx/Common_Nav.ashx',
      data: { act: 'Get_NavigatorGroup' }, async: false,
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
    return list;
  }

  function loadGroupList() {
    _groupList = getGroupList();
    var html = '';
    for (var i = 0; i < _groupList.length; i++) {
      var item = _groupList[i];
      var activeClass = (i === 0) ? ' active' : '';
      html += '<div class="nav-group-item' + activeClass + '" data-group-id="' + item.ModuleGroupId + '">';
      html += '<i class="layui-icon layui-icon-template-1"></i>' + item.ModuleGroupName;
      html += '</div>';
    }
    document.getElementById('nav-group-list').innerHTML = html;

    var items = document.querySelectorAll('.nav-group-item');
    for (var j = 0; j < items.length; j++) {
      items[j].onclick = function () {
        var groupId = this.getAttribute('data-group-id');
        currentGroupId = groupId;
        for (var k = 0; k < items.length; k++) { items[k].classList.remove('active'); }
        this.classList.add('active');
        // TODO: 根据 groupId 加载对应的流程图数据
        layer.msg('切换到分组：' + this.innerText.trim(), { icon: 0, time: 1500 });
      };
    }
  }

  function setGroup() {
    var html = '';
    html += "<div class='navigatorGroup' style='margin: 10px 20px;'>";
    html += "<div class='navigatorSearch' style='margin: 0 20px; padding-bottom: 10px;'>";
    html += '新名称：<input type="text" id="navigatorInput" class="layui-input" maxlength="120" autocomplete="off" placeholder="请输入分组名" style="width:159px;padding-left:3px;display:inline-block;vertical-align:middle;" >';
    html += '<input type="button" id="navigatorAdd" class="layui-btn layui-btn-sm" value="添加" style="margin-left:6px;box-sizing:border-box;width:60px;">';
    html += '</div>';
    html += "<div class='navigatorBody' style='height: 316px;overflow: auto;padding: 0px 10px;'>";
    for (var i = 0; i < _groupList.length; i++) {
      html += '<div class="nameItem" style="margin-bottom: 10px;border: 1px solid #ccc;background: url(/images/picklistdrag.gif) no-repeat 5px;">';
      html += '<input type="text" ModuleGroupId="' + _groupList[i].ModuleGroupId + '" value="' + _groupList[i].ModuleGroupName + '" class="layui-input" placeholder="请输入分组名" style="margin-left:10px;width: 85%;border: none;padding-left:3px;" >';
      html += '<img alt="" style="border: 0px; cursor: pointer;position: relative;top: 2px;left: 13px;" title="删除" src="/images/picklistdeleteIcon.gif">';
      html += '</div>';
    }
    html += '</div></div>';

    layer.open({
      type: 1, title: '设置分组', content: html, area: ['380px', '440px'], btn: ['保存', '取消'],
      yes: function (index) {
        var saveData = [];
        var $navigatorGroup = $('.navigatorGroup');
        $navigatorGroup.find('.navigatorBody .nameItem .layui-input').each(function () {
          saveData.push({ ModuleGroupId: $(this).attr('ModuleGroupId'), ModuleGroupName: $(this).val() });
        });
        if (saveData.length === 0) { layer.msg('至少保留一个分组', { icon: 2 }); return; }
        $.ajax({
          type: 'POST', url: '/Common/Ashx/Common_Nav.ashx',
          data: { act: 'Save_NavigatorGroup', saveData: JSON.stringify(saveData) },
          success: function () { layer.msg('操作成功', { icon: 1 }); layer.close(index); loadGroupList(); },
          error: function () { layer.msg('保存失败', { icon: 2 }); }
        });
      },
      success: function (layero) {
        var $navigatorGroup = $(layero).find('.navigatorGroup');
        var $navigatorInput = $navigatorGroup.find('#navigatorInput');
        var $navigatorAdd = $navigatorGroup.find('#navigatorAdd');
        var $navigatorBody = $navigatorGroup.find('.navigatorBody');
        $navigatorAdd.on('click', function () {
          var idList = [];
          $navigatorGroup.find('.navigatorBody .nameItem .layui-input').each(function () {
            var oId = parseInt($(this).attr('ModuleGroupId'));
            if (!isNaN(oId) && oId !== 0) idList.push(oId);
          });
          idList.sort(function (a, b) { return a - b; });
          var nId = idList.pop();
          if (nId === undefined) nId = 1; else nId = nId + 1;
          $navigatorBody.append('<div class="nameItem" style="margin-bottom: 10px;border: 1px solid #ccc;background: url(/images/picklistdrag.gif) no-repeat 5px;">' +
            '<input type="text" ModuleGroupId="' + nId + '" value="' + $navigatorInput.val() + '" class="layui-input" placeholder="请输入分组名" style="margin-left:10px;width: 85%;border: none;padding-left:3px;" >' +
            '<img alt="" style="border: 0px; cursor: pointer;position: relative;top: 2px;left: 13px;" title="删除" src="/images/picklistdeleteIcon.gif"></div>');
        });
        $navigatorBody.on('click', '.nameItem img', function () { $(this).parent().remove(); });
      }
    });
  }

  // 初始化加载分组列表
  loadGroupList();
  document.getElementById('btn-set-group').onclick = function () { setGroup(); };

  // ========== 拖拽添加节点 ==========
  document.querySelectorAll('.node-item').forEach(function (item) {
    item.addEventListener('dragstart', function (e) {
      e.dataTransfer.setData('type', this.getAttribute('data-type'));
    });
  });

  var graphEl = document.getElementById('graph');
  var lastMouseX = 0, lastMouseY = 0;

  document.addEventListener('dragover', function (e) {
    e.preventDefault();
    lastMouseX = e.clientX; lastMouseY = e.clientY;
  });

  graphEl.addEventListener('drop', function (e) {
    e.preventDefault(); e.stopPropagation();
    var type = e.dataTransfer.getData('type');
    if (!type) return;
    var clientX = lastMouseX || e.clientX, clientY = lastMouseY || e.clientY;
    var point = lf.getPointByClient(clientX, clientY);
    var x = point.canvasOverlayPosition.x, y = point.canvasOverlayPosition.y;
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
    lastMouseX = 0; lastMouseY = 0;
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
    var colors = defaultColors[data.type] || { fill: '#ffffff', stroke: '#333333' };
    var textVal = (data.text && data.text.value) || '';
    var moduleVal = props.module || (_moduleList.length > 0 ? String(_moduleList[0].Id) : '');

    document.getElementById('props-content').innerHTML =
      '<form class="layui-form" lay-filter="propsForm">' +
        '<div class="props-section"><div class="props-section-title">基本信息</div>' +
          '<div class="layui-form-item"><label class="layui-form-label">节点 ID</label><div class="layui-input-block"><input type="text" value="' + data.id + '" disabled class="layui-input layui-disabled"></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">节点文本</label><div class="layui-input-block"><input type="text" name="text" value="' + textVal + '" class="layui-input"></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">所属模块</label><div class="layui-input-block"><select name="module">' + buildModuleOptions(moduleVal) + '</select></div></div>' +
        '</div>' +
        '<div class="props-section"><div class="props-section-title">详细描述</div>' +
          '<div class="layui-form-item"><label class="layui-form-label">负责人</label><div class="layui-input-block"><input type="text" name="owner" value="' + (props.owner || '') + '" placeholder="请输入负责人" class="layui-input"></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">描述</label><div class="layui-input-block"><textarea name="desc" placeholder="请输入节点描述">' + (props.desc || '') + '</textarea></div></div>' +
        '</div>' +
        '<div class="props-section"><div class="props-section-title">外观样式</div>' +
          '<div class="layui-form-item"><label class="layui-form-label">背景色</label><div class="layui-input-block"><div class="color-field" id="node-fill-color"></div></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">边框色</label><div class="layui-input-block"><div class="color-field" id="node-stroke-color"></div></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">字体色</label><div class="layui-input-block"><div class="color-field" id="node-text-color"></div></div></div>' +
        '</div>' +
        '<div class="props-actions">' +
          '<button type="submit" class="layui-btn" lay-submit lay-filter="saveProps">保存修改</button>' +
          '<button type="button" class="layui-btn layui-btn-danger" id="btn-delete">删除节点</button>' +
        '</div></form>';
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
    var edgeModel = lf.graphModel.getEdgeModelById(data.id);
    var currentEdgeType = edgeModel ? edgeModel.type : 'custom-bezier';

    document.getElementById('props-content').innerHTML =
      '<form class="layui-form" lay-filter="propsForm">' +
        '<div class="props-section"><div class="props-section-title">文本信息</div>' +
          '<div class="layui-form-item"><label class="layui-form-label">连线文案</label><div class="layui-input-block"><input type="text" name="text" value="' + textVal + '" placeholder="如：同意、拒绝" class="layui-input"></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">文本位置</label><div class="layui-input-block"><select name="textPosition">' +
            '<option value="start"' + (props.textPosition === 'start' ? ' selected' : '') + '>起点附近</option>' +
            '<option value="middle"' + (!props.textPosition || props.textPosition === 'middle' ? ' selected' : '') + '>中间位置</option>' +
            '<option value="end"' + (props.textPosition === 'end' ? ' selected' : '') + '>终点附近</option></select></div></div>' +
        '</div>' +
        '<div class="props-section"><div class="props-section-title">线条样式</div>' +
          '<div class="layui-form-item"><label class="layui-form-label">线条类型</label><div class="layui-input-block"><select name="edgeType">' +
            '<option value="custom-bezier"' + (currentEdgeType === 'custom-bezier' ? ' selected' : '') + '>〰️ 曲线</option>' +
            '<option value="custom-polyline"' + (currentEdgeType === 'custom-polyline' ? ' selected' : '') + '>📐 折线</option>' +
            '<option value="custom-line"' + (currentEdgeType === 'custom-line' ? ' selected' : '') + '>📏 直线</option></select></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">线条颜色</label><div class="layui-input-block"><div class="color-field" id="edge-stroke-color"></div></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">文字颜色</label><div class="layui-input-block"><div class="color-field" id="edge-text-color"></div></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">线条粗细</label><div class="layui-input-block"><select name="strokeWidth">' +
            '<option value="1"' + (props.strokeWidth == 1 ? ' selected' : '') + '>1 px</option>' +
            '<option value="2"' + (!props.strokeWidth || props.strokeWidth == 2 ? ' selected' : '') + '>2 px</option>' +
            '<option value="3"' + (props.strokeWidth == 3 ? ' selected' : '') + '>3 px</option></select></div></div>' +
          '<div class="layui-form-item"><label class="layui-form-label">线条样式</label><div class="layui-input-block"><select name="strokeDasharray">' +
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
  }

  function renderBlankPanel() {
    currentElementId = null; currentElementType = null;
    document.getElementById('props-content').innerHTML =
      '<div class="empty-tip"><i class="layui-icon layui-icon-set"></i>请在画布中选中节点或连线<br>以配置详细属性</div>' +
      '<div class="props-help"><p><b>快捷操作</b></p>' +
        '<p><kbd>Ctrl</kbd>+<kbd>Z</kbd> 撤销 &nbsp; <kbd>Ctrl</kbd>+<kbd>Y</kbd> 重做</p>' +
        '<p><kbd>Delete</kbd> 删除选中元素</p><p>双击节点或连线可编辑文字</p>' +
        '<p style="margin-top:16px"><button type="button" class="layui-btn layui-btn-fluid layui-btn-primary layui-btn-sm" id="btn-clear" style="border-radius:6px;">清空画布</button></p>' +
      '</div>';
    form.render();
    document.getElementById('btn-clear').onclick = function () {
      layer.confirm('确定要清空整个画布吗？', { icon: 3 }, function (i) { lf.clearData(); clearPanel(); layer.close(i); });
    };
  }

  function clearPanel() {
    currentElementId = null; currentElementType = null;
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
  document.getElementById('edge-type-select').onchange = function () { lf.setDefaultEdgeType(this.value); };

  // 左右面板折叠
  var leftPanel = document.getElementById('left-panel');
  var rightPanel = document.getElementById('right-panel');
  var toggleLeftBtn = document.getElementById('toggle-left');
  var toggleRightBtn = document.getElementById('toggle-right');

  toggleLeftBtn.onclick = function () {
    leftPanel.classList.toggle('collapsed');
    var isCollapsed = leftPanel.classList.contains('collapsed');
    toggleLeftBtn.innerHTML = isCollapsed ? '<i class="layui-icon layui-icon-right"></i>' : '<i class="layui-icon layui-icon-left"></i>';
    setTimeout(function () { lf.resize(); }, 300);
  };
  toggleRightBtn.onclick = function () {
    rightPanel.classList.toggle('collapsed');
    var isCollapsed = rightPanel.classList.contains('collapsed');
    toggleRightBtn.innerHTML = isCollapsed ? '<i class="layui-icon layui-icon-left"></i>' : '<i class="layui-icon layui-icon-right"></i>';
    setTimeout(function () { lf.resize(); }, 300);
  };

  // 导出图片
  document.getElementById('btn-snapshot').onclick = function () {
    layer.msg('正在生成图片...', { icon: 16, shade: 0.1, time: 0 });
    html2canvas(document.querySelector('#graph'), { backgroundColor: '#fafafa' }).then(function (canvas) {
      var link = document.createElement('a');
      link.download = 'navigator.png'; link.href = canvas.toDataURL(); link.click();
      layer.closeAll(); layer.msg('图片导出成功', { icon: 1 });
    });
  };

  // 小地图开关
  var miniMapVisible = false;
  document.getElementById('btn-minimap').onclick = function () {
    if (!lf.extension || !lf.extension.miniMap) return layer.msg('小地图插件未加载', { icon: 2 });
    if (miniMapVisible) {
      lf.extension.miniMap.hide(); miniMapVisible = false;
      this.classList.remove('layui-btn-warm'); this.classList.add('layui-btn-primary');
    } else {
      lf.extension.miniMap.show(); miniMapVisible = true;
      this.classList.remove('layui-btn-primary'); this.classList.add('layui-btn-warm');
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

  // 保存发布
  document.getElementById('btn-save').onclick = function () {
    var data = lf.getGraphData();
    if (!data.nodes || data.nodes.length === 0) return layer.msg('画布为空，无法保存！', { icon: 2 });

    // 校验所有节点是否已分配模块
    var unassignedNodes = [];
    for (var i = 0; i < data.nodes.length; i++) {
      var node = data.nodes[i], props = node.properties || {};
      if (!props.module || props.module === '') unassignedNodes.push((node.text && node.text.value) || node.id);
    }
    if (unassignedNodes.length > 0) return layer.msg('以下节点未分配模块：' + unassignedNodes.join('、'), { icon: 2, time: 5000 });

    // 校验是否已选择导航分组
    if (!currentGroupId) return layer.msg('请先在左侧选择一个导航分组！', { icon: 2 });

    layer.confirm('确定要保存当前导航图吗？', { icon: 3, title: '保存确认' }, function (index) {
      layer.close(index);
      var jsonStr = JSON.stringify(data);
      $.ajax({
        type: 'POST', url: '/Common/Ashx/Common_Nav.ashx',
        data: { act: 'Save_Navigator_DiagramData', moduleGroupId: currentGroupId, data: jsonStr },
        success: function () { layer.msg('保存成功！', { icon: 1, time: 2000 }); },
        error: function () { layer.msg('保存失败，请重试！', { icon: 2 }); }
      });
    });
  };

  // 跳转到审批设计页
  document.getElementById('btn-go-designer').onclick = function () {
    window.location.href = 'designer.html';
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

  document.getElementById('menu-edit').onclick = function () {
    if (currentElementType === 'node') { var d = lf.getNodeDataById(currentElementId); if (d) renderNodePanel(d); }
    else if (currentElementType === 'edge') { var d = lf.getEdgeDataById(currentElementId); if (d) renderEdgePanel(d); }
    menu.style.display = 'none';
  };

  document.getElementById('menu-delete').onclick = function () {
    if (currentElementType === 'node') lf.deleteNode(currentElementId);
    else if (currentElementType === 'edge') lf.deleteEdge(currentElementId);
    clearPanel(); menu.style.display = 'none';
  };
});
/**
 * 功能导航页 - 只读画布 + 分组导航
 * 依赖: LogicFlow 2.2.3 (CDN全局变量) + Layui
 */
layui.use(['layer'], function () {
  var layer = layui.layer;

  // 从全局 LogicFlow 对象获取节点/边基类
  var CircleNode = LogicFlow.CircleNode;
  var CircleNodeModel = LogicFlow.CircleNodeModel;
  var RectNode = LogicFlow.RectNode;
  var RectNodeModel = LogicFlow.RectNodeModel;
  var DiamondNode = LogicFlow.DiamondNode;
  var DiamondNodeModel = LogicFlow.DiamondNodeModel;

  // ========== 自定义节点样式工具函数（只读渲染需要） ==========
  function applyNodeStyle(model, style, defaultFill, defaultStroke) {
    var props = model.properties || {};
    style.fill = props.fill || defaultFill;
    style.stroke = props.stroke || defaultStroke;
    style.strokeWidth = props.strokeWidth ? parseInt(props.strokeWidth) : 2;
    return style;
  }
  function applyNodeTextStyle(model, style) {
    var props = model.properties || {};
    if (props.textColor) style.color = props.textColor;
    return style;
  }

  // ========== 初始化 LogicFlow（只读配置） ==========
  var container = document.querySelector('#graph');
  var lf = new LogicFlow({
    container: container,
    width: container.clientWidth || 800,
    height: container.clientHeight || 600,
    grid: { visible: false },
    keyboard: { enabled: false },
    edgeType: 'custom-bezier',
    stopScrollGraph: true,
    stopZoomGraph: false,
    stopMoveGraph: true,
    adjustEdge: false,
    adjustEdgeMiddle: false,
    adjustEdgeStartAndEnd: false,
    allowRotate: false,
    allowResize: false,
    nodeTextEdit: false,
    edgeTextEdit: false,
    nodeTextDraggable: false,
    edgeTextDraggable: false,
    hideAnchors: true,
    nodeSelectedOutline: false,
    edgeSelectedOutline: false,
    snapline: false,
    hoverOutline: false,
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

  // ========== 注册自定义节点类型（只读渲染需要） ==========

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

  // 长方形
  class OblongModel extends RectNodeModel {
    initNodeData(data) { super.initNodeData(data); this.width = 160; this.height = 50; this.radius = 4; }
    setAttributes() { this.width = 160; this.height = 50; }
    getNodeStyle() { var s = super.getNodeStyle(); s.radius = 4; return applyNodeStyle(this, s, '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'oblong', view: RectNode, model: OblongModel });

  // 直角长方形
  class SharpRectModel extends RectNodeModel {
    initNodeData(data) { super.initNodeData(data); this.width = 160; this.height = 70; this.radius = 0; }
    setAttributes() { this.width = 160; this.height = 70; this.radius = 0; }
    getNodeStyle() { var s = super.getNodeStyle(); s.radius = 0; return applyNodeStyle(this, s, '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'sharp-rect', view: RectNode, model: SharpRectModel });

  // 圆角长方形
  class RoundRectModel extends RectNodeModel {
    initNodeData(data) { super.initNodeData(data); this.width = 160; this.height = 70; this.radius = 25; }
    setAttributes() { this.width = 160; this.height = 70; this.radius = 25; }
    getNodeStyle() { var s = super.getNodeStyle(); s.radius = 25; return applyNodeStyle(this, s, '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  lf.register({ type: 'round-rect', view: RectNode, model: RoundRectModel });

  // 文档
  class DocumentModel extends RectNodeModel {
    initNodeData(data) { super.initNodeData(data); this.width = 140; this.height = 80; }
    setAttributes() { this.width = 140; this.height = 80; }
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  class DocumentView extends RectNode {
    getShape() {
      const { x, y, width, height } = this.props.model;
      const style = this.props.model.getNodeStyle();
      const w = width, ht = height, bottomY = y + ht / 2, amp = 12;
      const pathD = `M ${x - w/2} ${y - ht/2} L ${x + w/2} ${y - ht/2} L ${x + w/2} ${bottomY} C ${x + w/6} ${bottomY - amp}, ${x + w/6} ${bottomY - amp}, ${x} ${bottomY} C ${x - w/6} ${bottomY + amp}, ${x - w/6} ${bottomY + amp}, ${x - w/2} ${bottomY} Z`;
      return h('g', {}, [h('path', { d: pathD, fill: style.fill, stroke: style.stroke, strokeWidth: style.strokeWidth || 2 })]);
    }
  }
  lf.register({ type: 'document', view: DocumentView, model: DocumentModel });

  // 子流程
  class SubprocessModel extends RectNodeModel {
    initNodeData(data) { super.initNodeData(data); this.width = 160; this.height = 70; }
    setAttributes() { this.width = 160; this.height = 70; }
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  class SubprocessView extends RectNode {
    getShape() {
      const { x, y, width, height } = this.props.model;
      const style = this.props.model.getNodeStyle();
      return h('g', {}, [
        h('rect', { x: x-width/2, y: y-height/2, width: width, height: height, fill: style.fill, stroke: style.stroke, strokeWidth: style.strokeWidth || 2 }),
        h('line', { x1: x-width/2+30, y1: y-height/2, x2: x-width/2+30, y2: y+height/2, stroke: style.stroke, strokeWidth: style.strokeWidth || 2 }),
        h('line', { x1: x+width/2-30, y1: y-height/2, x2: x+width/2-30, y2: y+height/2, stroke: style.stroke, strokeWidth: style.strokeWidth || 2 })
      ]);
    }
  }
  lf.register({ type: 'subprocess', view: SubprocessView, model: SubprocessModel });

  // 内部存储
  class InternalStorageModel extends RectNodeModel {
    initNodeData(data) { super.initNodeData(data); this.width = 160; this.height = 70; }
    setAttributes() { this.width = 160; this.height = 70; }
    getNodeStyle() { return applyNodeStyle(this, super.getNodeStyle(), '#ffffff', '#333333'); }
    getTextStyle() { return applyNodeTextStyle(this, super.getTextStyle()); }
  }
  class InternalStorageView extends RectNode {
    getShape() {
      const { x, y, width, height } = this.props.model;
      const style = this.props.model.getNodeStyle();
      return h('g', {}, [
        h('rect', { x: x-width/2, y: y-height/2, width: width, height: height, fill: style.fill, stroke: style.stroke, strokeWidth: style.strokeWidth || 2 }),
        h('line', { x1: x-width/2, y1: y-height/2+10, x2: x+width/2, y2: y-height/2+10, stroke: style.stroke, strokeWidth: style.strokeWidth || 2 }),
        h('line', { x1: x-width/2+20, y1: y-height/2, x2: x-width/2+20, y2: y+height/2, stroke: style.stroke, strokeWidth: style.strokeWidth || 2 })
      ]);
    }
  }
  lf.register({ type: 'internal-storage', view: InternalStorageView, model: InternalStorageModel });

  // ========== 注册自定义边类型（只读渲染需要） ==========
  var PolylineEdge = LogicFlow.PolylineEdge;
  var PolylineEdgeModel = LogicFlow.PolylineEdgeModel;
  var BezierEdge = LogicFlow.BezierEdge;
  var BezierEdgeModel = LogicFlow.BezierEdgeModel;
  var LineEdge = LogicFlow.LineEdge;
  var LineEdgeModel = LogicFlow.LineEdgeModel;

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
        style.background = { fill: '#fff', stroke: '#e6e6e6', radius: 2 };
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

  class CustomBezierModel extends edgeStyleMixin(BezierEdgeModel) {}
  lf.register({ type: 'custom-bezier', view: BezierEdge, model: CustomBezierModel });
  class CustomPolylineModel extends edgeStyleMixin(PolylineEdgeModel) {}
  lf.register({ type: 'custom-polyline', view: PolylineEdge, model: CustomPolylineModel });
  class CustomLineModel extends edgeStyleMixin(LineEdgeModel) {}
  lf.register({ type: 'custom-line', view: LineEdge, model: CustomLineModel });

  // 渲染空画布
  lf.render({ nodes: [], edges: [] });
  setTimeout(function() { lf.resize(); }, 100);
  window.lf = lf;

  // ========== 导航分组 ==========
  var _groupList = [];
  var currentGroupId = null;

  function getGroupList() {
    var list = [];
    $.ajax({
      type: 'POST',
      url: '/Common/Ashx/Common_Nav.ashx',
      data: { act: 'Get_NavigatorGroup' },
      async: false,
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
    return list;
  }

  function loadGroupList() {
    _groupList = getGroupList();
    var html = '';
    for (var i = 0; i < _groupList.length; i++) {
      var item = _groupList[i];
      var activeClass = (i === 0) ? ' active' : '';
      html += '<div class="nav-group-item' + activeClass + '" data-group-id="' + item.ModuleGroupId + '">';
      html += '<i class="layui-icon layui-icon-template-1"></i>' + item.ModuleGroupName;
      html += '</div>';
    }
    document.getElementById('nav-group-list').innerHTML = html;

    var items = document.querySelectorAll('.nav-group-item');
    for (var j = 0; j < items.length; j++) {
      items[j].onclick = function () {
        var groupId = this.getAttribute('data-group-id');
        currentGroupId = groupId;
        for (var k = 0; k < items.length; k++) { items[k].classList.remove('active'); }
        this.classList.add('active');
        // TODO: 根据 groupId 加载对应的流程图数据
        layer.msg('切换到分组：' + this.innerText.trim(), { icon: 0, time: 1500 });
      };
    }
  }

  function setGroup() {
    var html = '';
    html += "<div class='navigatorGroup' style='margin: 10px 20px;'>";
    html += "<div class='navigatorSearch' style='margin: 0 20px; padding-bottom: 10px;'>";
    html += '新名称：<input type="text" id="navigatorInput" class="layui-input" maxlength="120" autocomplete="off" placeholder="请输入分组名" style="width:159px;padding-left:3px;display:inline-block;vertical-align:middle;" >';
    html += '<input type="button" id="navigatorAdd" class="layui-btn layui-btn-sm" value="添加" style="margin-left:6px;box-sizing:border-box;width:60px;">';
    html += '</div>';
    html += "<div class='navigatorBody' style='height: 316px;overflow: auto;padding: 0px 10px;'>";
    for (var i = 0; i < _groupList.length; i++) {
      html += '<div class="nameItem" style="margin-bottom: 10px;border: 1px solid #ccc;background: url(/images/picklistdrag.gif) no-repeat 5px;">';
      html += '<input type="text" ModuleGroupId="' + _groupList[i].ModuleGroupId + '" value="' + _groupList[i].ModuleGroupName + '" class="layui-input" placeholder="请输入分组名" style="margin-left:10px;width: 85%;border: none;padding-left:3px;" >';
      html += '<img alt="" style="border: 0px; cursor: pointer;position: relative;top: 2px;left: 13px;" title="删除" src="/images/picklistdeleteIcon.gif">';
      html += '</div>';
    }
    html += '</div></div>';

    layer.open({
      type: 1, title: '设置分组', content: html, area: ['380px', '440px'], btn: ['保存', '取消'],
      yes: function (index) {
        var saveData = [];
        var $navigatorGroup = $('.navigatorGroup');
        $navigatorGroup.find('.navigatorBody .nameItem .layui-input').each(function () {
          saveData.push({ ModuleGroupId: $(this).attr('ModuleGroupId'), ModuleGroupName: $(this).val() });
        });
        if (saveData.length === 0) { layer.msg('至少保留一个分组', { icon: 2 }); return; }
        $.ajax({
          type: 'POST', url: '/Common/Ashx/Common_Nav.ashx',
          data: { act: 'Save_NavigatorGroup', saveData: JSON.stringify(saveData) },
          success: function () { layer.msg('操作成功', { icon: 1 }); layer.close(index); loadGroupList(); },
          error: function () { layer.msg('保存失败', { icon: 2 }); }
        });
      },
      success: function (layero) {
        var $navigatorGroup = $(layero).find('.navigatorGroup');
        var $navigatorInput = $navigatorGroup.find('#navigatorInput');
        var $navigatorAdd = $navigatorGroup.find('#navigatorAdd');
        var $navigatorBody = $navigatorGroup.find('.navigatorBody');
        $navigatorAdd.on('click', function () {
          var idList = [];
          $navigatorGroup.find('.navigatorBody .nameItem .layui-input').each(function () {
            var oId = parseInt($(this).attr('ModuleGroupId'));
            if (!isNaN(oId) && oId !== 0) idList.push(oId);
          });
          idList.sort(function (a, b) { return a - b; });
          var nId = idList.pop();
          if (nId === undefined) nId = 1; else nId = nId + 1;
          $navigatorBody.append('<div class="nameItem" style="margin-bottom: 10px;border: 1px solid #ccc;background: url(/images/picklistdrag.gif) no-repeat 5px;">' +
            '<input type="text" ModuleGroupId="' + nId + '" value="' + $navigatorInput.val() + '" class="layui-input" placeholder="请输入分组名" style="margin-left:10px;width: 85%;border: none;padding-left:3px;" >' +
            '<img alt="" style="border: 0px; cursor: pointer;position: relative;top: 2px;left: 13px;" title="删除" src="/images/picklistdeleteIcon.gif"></div>');
        });
        $navigatorBody.on('click', '.nameItem img', function () { $(this).parent().remove(); });
      }
    });
  }

  // 初始化加载分组列表
  loadGroupList();

  // 绑定设置分组按钮事件
  document.getElementById('btn-set-group').onclick = function () { setGroup(); };

  // ========== 节点点击弹出信息 ==========
  lf.on('node:click', function (arg) {
    var text = (arg.data.text && arg.data.text.value) || '未命名节点';
    var type = arg.data.type || 'unknown';
    var props = arg.data.properties || {};
    console.log('节点点击:', arg.data);
    var info = '节点：' + text + '（类型：' + type + '）';
    if (props.owner) info += '\n负责人：' + props.owner;
    if (props.desc) info += '\n描述：' + props.desc;
    layer.msg(info, { icon: 0, time: 3000 });
  });

  // ========== 工具栏按钮 ==========
  document.getElementById('btn-zoom-in').onclick = function () { lf.zoom(true); };
  document.getElementById('btn-zoom-out').onclick = function () { lf.zoom(false); };
  document.getElementById('btn-fit').onclick = function () { lf.fitView(80); };
  document.getElementById('btn-reset').onclick = function () { lf.resetZoom(); };
  document.getElementById('btn-fullscreen').onclick = function () { document.body.classList.toggle('fullscreen-mode'); lf.resize(); };

  // 小地图开关
  var miniMapVisible = false;
  document.getElementById('btn-minimap').onclick = function () {
    if (!lf.extension || !lf.extension.miniMap) return layer.msg('小地图插件未加载', { icon: 2 });
    if (miniMapVisible) {
      lf.extension.miniMap.hide(); miniMapVisible = false;
      this.classList.remove('layui-btn-warm'); this.classList.add('layui-btn-primary');
    } else {
      lf.extension.miniMap.show(); miniMapVisible = true;
      this.classList.remove('layui-btn-primary'); this.classList.add('layui-btn-warm');
    }
  };

  // 设置按钮 → 跳转到设计页
  document.getElementById('btn-design').onclick = function () {
    var url = 'designer.html';
    if (currentGroupId) url += '?groupId=' + currentGroupId;
    window.location.href = url;
  };

  // 窗口自适应
  window.addEventListener('resize', function () { lf.resize(); });
});
