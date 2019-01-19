# Bootstrap Data Table

业余时间忙里抽空实现中....

# 已完成功能
- 基本数据渲染
- 数据过滤
- 数据排序
- 数据添加
- 数据列事件监听

# 基本演示

导入相关js/css后，html只需要写以下这一句即可

```html
<table id="tb-sample"></table>
```

允许自行添加`<caption>` `<thead>` `<tbody>`标签

```html
<table id="tb-sample">
    <caption></caption>
    <thead></thead>
    <tbody></tbody>
</table>
```

### 初始化

```javascript
$('#tb-sample').dataTable({
  title: '用户',			   // 标题
  addible: true,			// 显示添加按钮
  filterable: true,			// 开启过滤筛选功能
  fields: {					// 显示的字段，以及列名
    id: '序号',
    name: '姓名',
    age: '年龄',
    gender: '性别',
    'bag.size': '背包大小'
  },
  data: [					//初始化数据
    {
      id: 1,
      name: 'name',
      age: '18',
      gender: 'male',
      bag: {
        size: 100
      }
    },
    {
      id: 2,
      name: 'name2',
      age: '19',
      gender: 'female',
      bag: {
        size: 100
      }
    }
  ]
})
```

![](./screenshot/base_table.gif)

### 添加数据

```javascript
$('#tb-sample').dataTable('addData', [{id: 3, name: 'new'}, {id: 4}])
```

### 事件监听

```javascript
/**
 * 添加点击监听
 * @param data 点击列所对应的数据项
 */
$('#tb-sample').dataTable('event', 'click', function (data) {
    alert("单击， 数据：" + JSON.stringify(data))
})

$('#tb-sample').dataTable('event', 'mouseenter', function () {
  $(this).css('background', 'yellow')
}).dataTable('event', 'mouseleave', function () {
  $(this).css('background', 'white')
})
```

![](./screenshot/event.gif)