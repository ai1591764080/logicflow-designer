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
