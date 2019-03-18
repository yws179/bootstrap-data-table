/*
 * Plugin:  bootstrap-data-table
 * Author:  Weisen Yan (严伟森)
 * Version: 0.1.1
 * Email:   yws179@gmail.com
 * Github:  https://github.com/yws179/bootstrap-data-table
 * Licensed under the MIT license
 */
(function ($) {
  
  $.fn.dataTable = function (option) {
    var args = arguments
    return this.each(function () {
      var $this = $(this),
        dataTable = $this.data('dataTable'),
        options = typeof option == 'object' && option
      
      if (!dataTable) {
        dataTable = new DataTable($this, options)
        $this.data('dataTable', dataTable)
      }
      
      if ('string' === typeof option) {
        dataTable[option].apply(dataTable, Array.prototype.slice.call(args, 1))
      }
    })
  }
  
  var DataTable = function ($table, options) {
  
    if (!$table.is('table')) {
      throw new Error('This is not <table> DOM')
    }
    
    this.$table = $table
    
    this.$caption = this.$table.find('caption')
    
    this.$thead = this.$table.find('thead')
    
    this.$tbody = this.$table.find('tbody')
    
    this.$pagination = this.$table.siblings('.pagination')
    
    this.options = options || {}
    
    this.data = this.options.data || []
    
    this.visibleData = this.data
    
    this.visibleCondition = {}

    this.preProcessor = this.options.preProcessor
    
    this.buttons = this.options.buttons || []
    
    this.refreshable = this.options.refreshable
    
    this.filterable = this.options.filterable

    this.operate = this.options.operate

    this.totalLabel = this.options.totalLabel || ''

    this.totalElements = 0

    this.pageable = this.options.pageable
    
    this.pageSize = this.options.pageSize || 10

    this.sizeSelector = this.options.sizeSelector || {}
    
    this.page = this.options.page || 1
    
    this._init()
    
  }
  
  DataTable.prototype = {
  
    constructor: DataTable,
    
    _init: function () {
      this.$table.addClass('table table-striped table-bordered table-hover bs-data-table')
  
      if (this.$caption.length < 1) {
        this.$caption = $('<caption></caption>')
        this.$table.prepend(this.$caption)
      }
      
      if (this.$thead.length < 1) {
        this.$thead = $('<thead></thead>')
        this.$caption.after(this.$thead)
      }
  
      if (this.$tbody.length < 1) {
        this.$tbody = $('<tbody></tbody>')
        this.$thead.after(this.$tbody)
      }
      
      this.rendCaption()
      
      this.renderHead()

      this.renderData()
    },
    
    rendCaption: function () {
      var $btnGroup = $('<div class="btn-group pull-right"></div>')
      
      for (var i = 0; i < this.buttons.length; i++) {
        var button = this.buttons[i],
          $btn = $(button.dom)
        for (var event in button.events) {
          $btn.on(event, button.events[event])
        }
        $btnGroup.append($btn)
      }
      
      if (this.refreshable) {
        var $btn = $('<button class="btn btn-default btn-refresh" type="button" title="刷新"><span class="glyphicon glyphicon-refresh"></span></button>')
        $btn.on('click', function () {
          var $filter = this.$thead.find('tr.bs-data-table-filter')
          $filter.find(':input').val('')
          $filter.find(':input:first()').change()
        }.bind(this))
        $btnGroup.append($btn)
      }
      
      if (this.filterable) {
        $btnGroup.append('<button class="btn btn-default btn-filter" type="button" title="过滤器"><span class="glyphicon glyphicon-filter"></span></button>')
      }
      
      this.$caption.append($btnGroup)
      if (this.options.title) {
        this.$caption.prepend(this.options.title)
      }
    },
    
    renderHead: function () {
      var $tr = $('<tr></tr>')
      for (var key in this.options.fields) {
        var $sortBtn = $('<div class="pull-right"></div>')
          .append('<div class="btn-sort" data-sort-by=":sort-by" data-order="asc"><span class="glyphicon glyphicon-chevron-up"></span></div>'.replace(':sort-by', key))
          .append('<div class="btn-sort" data-sort-by=":sort-by" data-order="desc"><span class="glyphicon glyphicon-chevron-down"></span></div>'.replace(':sort-by', key))
        $tr.append($('<th>' + this.options.fields[key] + '</th>').append($sortBtn))
      }
      if (this.operate) {
        $tr.append('<th>' + (this.options.operate.field || 'operate') + '</th>')
      }
      this.$thead.prepend($tr)
      var table = this
      this.$thead.find('.btn-sort').click(function () {
        var $this   = $(this),
            sortBy  = $this.data('sort-by'),
            order   = $this.data('order')
        sort(table.data, sortBy, order == 'desc')
        table.renderData()
      })
      
      if (this.filterable) {
        if (this.$thead.find('.bs-data-table-filter').length < 1) {
          var $filter = $('<tr class="bs-data-table-filter"></tr>')
          for (var key in this.options.fields) {
            $filter.append('<th><input class="form-control" name=":name"></th>'.replace(':name', key))
          }
          if (this.operate) {
            $filter.append('<th><button class="btn btn-default btn-reset-filter"><span class="glyphicon glyphicon-repeat"></span></button></th>')
          }
          this.$thead.append($filter)
        }

        var $filter = $filter || this.$thead.find('.bs-data-table-filter')
        if (this.operate) {
          $filter.find('.btn-reset-filter').click(function () {
            var $items = $filter.find(':input')
            $items.val('')
            $items.change()
          })
        }
        this.$caption.find('.btn-filter').click(function () {
          $(this).toggleClass('active')
          $filter.toggle()
          $filter.find(':input').val('')
          $filter.find(':input:first()').change()
        })
        
        this.$table.on('change keyup paste', '.bs-data-table-filter :input', function () {
          var filterConditions = {}
          this.$table.find('.bs-data-table-filter :input').each(function() {
            var name = $(this).attr('name')
            var value = $(this).val()
            if ($(this).data('strict')) {
              fillValue(filterConditions, name + '-strict', true)
            }
            fillValue(filterConditions, name, value)
          })
          this.visibleCondition = filterConditions
          this.renderData()
        }.bind(this))
      }
    },
    
    renderData: function (data) {
      this.data = data || this.data
      this.visibleData = filtrate(this.data, this.visibleCondition)
      this.totalElements = this.visibleData.length
      var totalPage = Math.ceil(this.visibleData.length / this.pageSize)
      if (this.pageable) {
        if (this.page > totalPage) {
          this.page = totalPage
        }
        if (totalPage > 0 && this.page < 1) {
          this.page = 1
        }
        this.visibleData = Array.prototype.slice.call(this.visibleData, (this.page - 1) * this.pageSize, Math.min(this.page * this.pageSize, this.visibleData.length))
      }
      this.$tbody.html('')
      if (this.visibleData.length < 1) {
        this.$tbody.append('<tr><td class="text-center" colspan=":colspan"> ---- · ---- </td></tr>'.replace(':colspan', this.$thead.find('tr:first() th').length))
      } else {
        for (var i = 0; i < this.visibleData.length; i++) {
          var $tr = $('<tr></tr>'),
              currentData = this.preProcessor ? this.preProcessor(deepClone(this.visibleData[i])) : this.visibleData[i]
          for (var key in this.options.fields) {
            $tr.append('<td>' + (getValue(currentData, key) || '') + '</td>')
          }
          if (this.operate) {
            $tr.append('<td>' +this.operate.content + '</td>')
          }
          this.$tbody.append($tr)
        }
      }
      if (this.pageable) {
        this.renderPagination(totalPage)
      }
    },
    
    renderPagination: function (totalPage) {
      var nums = pageGenerator(this.page, totalPage),
        $pagination = $('<div class="bs-data-table-pagination"></div>'),
        $pageSeleter = $('<input class="form-control bs-data-table-page-select" type="number" min="1" max=":totalPage" value=":currentPage">'.replace(':currentPage', this.page).replace(':totalPage', totalPage)),
        $pageNums = $('<ul class="pagination bs-data-table-pagination"></ul>')

      $pagination.append('<span>' + this.totalLabel.replace('${total}', this.totalElements) + '</span>')

      var $laquo = $('<li data-page="1"><a href="javascript:void(0);">&laquo;</a></li>')
      if (this.page <= 1) {
        $laquo.addClass('disabled')
      }
      $pageNums.append($laquo)
      
      for (var i = 0; i < nums.length; i++) {
        var $pn = $('<li data-page=":num"><a href="javascript:void(0);">:num</a></li>'.replace(/:num/g, nums[i]))
        if (nums[i] == this.page) {
          $pn.addClass('active')
        }
        $pageNums.append($pn)
      }
      
      var $requo = $('<li data-page=":totalPage"><a href="javascript:void(0);">&raquo;</a></li>'.replace(':totalPage', totalPage))
      if (this.page == totalPage) {
        $requo.addClass('disabled')
      }
      $pageNums.append($requo)
      $pagination.append($pageNums)

      if (totalPage > 0) {
        $pagination.append('<span class="bs-data-table-page-total">/&nbsp;:totalPage</span>'.replace(':totalPage', totalPage))
        $pagination.append($pageSeleter)
      }

      $pagination.append(this.buildSizeSelector())

      if (this.$pagination.length > 0) {
        this.$pagination.replaceWith($pagination)
        this.$pagination = $pagination
      } else {
        this.$pagination = $pagination
        this.$table.after(this.$pagination)
      }
  
      var table = this
      $pagination.on('change', '.bs-data-table-page-select', function () {
        table.page = $(this).val()
        table.renderData()
      }).on('click', '.pagination li', function () {
        if ($(this).is('.disabled')) return
        table.page = $(this).data('page')
        table.renderData()
      }).on('change', '.bs-data-table-size-select', function () {
        table.pageSize = $(this).val()
        table.renderData()
      })
    },

    buildSizeSelector: function () {
      var title = this.sizeSelector.title,
          sizeArr = this.sizeSelector instanceof Array ? this.sizeSelector : this.sizeSelector.list,
          $selector =  $('<select class="form-control bs-data-table-size-select"></select>')
      if (sizeArr) {
        for (var i = 0; i < sizeArr.length; i++) {
          $selector.append('<option value="' + sizeArr[i] + '">' + sizeArr[i] + '</option>')
        }
        $selector.find('option[value="' + this.pageSize + '"]').prop('selected', true)
      }
      if (title) {
        $selector = $('<div class="pull-right"><span>' + title + '</span></div>').append($selector)
      }
      return $selector;
    },
    
    getIdx: function (data, fn) {
      fn.apply(this, this.data.indexOf(data))
    },
    
    getData: function (idx, fn) {
      var data = []
      if (idx instanceof Array) {
        idx.forEach(function (value) {
          data.push(this.data[value])
        }.bind(this))
        fn.apply(this, [data])
      } else {
        fn.apply(this, [this.data[idx]])
      }
    },
    
    getAllData: function (fn) {
      fn.apply(this, this.data)
    },
    
    addData: function (data) {
      if (data instanceof Array) {
        data.forEach(function (value) {
          this.data.push(value)
        }.bind(this))
      } else {
        this.data.push(data)
      }
      this.renderData()
    },
    
    removeData: function (idx) {
      if (idx instanceof Array) {
        idx.forEach(function (value) {
          this.data.splice(value, 1)
        }.bind(this))
      } else {
        this.data.splice(idx, 1)
      }
      this.renderData()
    },
    
    replaceData: function (idx, data) {
      this.data.splice(idx, 1, data)
      this.renderData()
    },
    
    event: function (type) {
      var table = this, childSelector, fn
      if (arguments.length > 2) {
        childSelector = arguments[1]
        fn = arguments[2]
      } else {
        childSelector = ''
        fn = arguments[1]
      }
      this.$tbody.on(type, 'tr ' + childSelector, function () {
        var idx = $(this).is('tr') ? $(this).index() : $(this).parentsUntil('tbody', 'tr').index(),
            data = table.visibleData[idx]
        fn.apply(this, [table.data.indexOf(data), data])
      })
    }
  }
  
  /**
   * 排序
   * @param array     数组
   * @param sortBy    Object排序依据的属性，为空以对象本身
   * @param desc      倒序（true/false）
   */
  var sort = function (array, sortBy, desc) {
    array.sort(function (a, b) {
      return compare(a, b, sortBy)
    })
    if (desc) {
      array.reverse()
    }
  }
  
  var compare = function (v1, v2, field) {
    if (field) {
      v1 = getValue(v1, field)
      v2 = getValue(v2, field)
    }
    if (/^\d+$/.test(v1) && /^\d+$/.test(v2)) {
      v1 = Number(v1)
      v2 = Number(v2)
    }
    if (v1 > v2 || !v2) {
      return 1
    } else if (v1 < v2 || !v1) {
      return -1
    }
    return v1.id > v2.id ? 1 : -1
  }
  
  /**
   * 数据过滤
   * @param array       原数组
   * @param conditions  过滤条件
   * @returns {Array}   过滤结果数组
   */
  var filtrate = function (array, conditions) {
    var newArray = []
    array.forEach(function (val) {
      if (!isFiltrate(val, conditions)) {
        newArray.push(val)
      }
    })
    return newArray
  }
  
  var isFiltrate = function (obj, conditions) {
    for (var key in conditions) {
      if (!conditions.hasOwnProperty(key) || key.endsWith('-strict')) {
        continue
      }
      if (conditions[key + '-strict'] && obj[key] != conditions[key]) {
        return true
      } else if ((obj[key] + '').indexOf(conditions[key]) == -1) {
        return true
      }
    }
    return false
  }
  
  /**
   * 页码生成器
   * @param currentPage 当前页码
   * @param totalPages 总页数
   * @returns {Array} 页码数组
   */
  function pageGenerator(currentPage, totalPages) {
    var nums = [],
      count = 5,
      startNum = 1
    if (totalPages < 1) {
      nums.push(1)
      return nums
    }
    if (totalPages <= count) {
      for (var i = 1; i <= totalPages; i++) {
        nums.push(i)
      }
      return nums
    }
    startNum = currentPage - Math.floor(count / 2)
    startNum = startNum > 0 ? startNum : 1
    startNum = startNum + count > totalPages ? totalPages - count + 1 : startNum
    for (var i = 0; i < count; i++) {
      nums.push(startNum + i)
    }
    return nums
  }
  
  /**
   * 空判断
   */
  var isEmpty = function (o) {
    return o == undefined || o == ''
  }
  
  /**
   * 给对象赋值 当name为a.b则表示对targetObj.a.b赋值
   * @param targetObj 目标对象
   * @param name      下标，子对象属性以‘parentObj.childObj.property’
   * @param value     值
   * @param type      特殊类型['list']
   */
  var fillValue = function (targetObj, name, value, type) {
    if (!isEmpty(targetObj) && !isEmpty(name) && !isEmpty(value)) {
      recursionFill(targetObj, name, value, type)
    }
  }
  
  var recursionFill = function (ref, name, value, type) {
    var dotIdx = name.indexOf('.')
    if (dotIdx == -1) {
      if (type == 'list') {
        ref[name] = ref[name] || []
        ref[name].push(value)
      } else {
        ref[name] = value
      }
      return
    }
    var tmpName = name.substr(0, dotIdx)
    if (isEmpty(ref[tmpName])) {
      ref[tmpName] = {}
    }
    recursionFill(ref[tmpName], name.substr(dotIdx + 1), value, type)
  }
  
  /**
   * 取对象属性值 当name为a.b则表示取targetObj.a.b的值
   * @param targetObj 目标对象
   * @param name      下标，子对象属性以‘parentObj.childObj.property’
   */
  var getValue = function (targetObj, name) {
    return (isEmpty(targetObj) || isEmpty(name)) ? undefined : recursionDrain(targetObj, name)
  }
  
  var recursionDrain = function (ref, name) {
    var dotIdx = name.indexOf('.')
    if (dotIdx == -1) {
      return ref[name]
    }
    var tmpName = name.substr(0, dotIdx)
    if (isEmpty(ref[tmpName])) {
      ref[tmpName] = {}
    }
    return recursionDrain(ref[tmpName], name.substr(dotIdx + 1))
  }

  /**
   * 克隆對象
   */
  function deepClone(source) {
    return JSON.parse(JSON.stringify(source))
  }
  
})(jQuery)