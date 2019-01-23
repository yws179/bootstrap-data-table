/*
 * Plugin:  bootstrap-data-table
 * Author:  Weisen Yan (严伟森)
 * Version: 0.0.4
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
    
    this.addible = this.options.addible
    
    this.refreshable = this.options.refreshable
    
    this.filterable = this.options.filterable
    
    this.pageable = this.options.pageable
    
    this.pageSize = this.options.pageSize || 10
    
    this.page = this.options.page || 1
    
    this._init()
    
  }
  
  DataTable.prototype = {
  
    constructor: DataTable,
    
    _init: function () {
      this.$table.addClass('table table-striped table-bordered table-hover data-table')
  
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
      
      if (this.addible) {
        $btnGroup.append(`
            <button class="btn btn-default btn-add" type="button" title="新增">
                <span class="glyphicon glyphicon-plus"></span>
            </button>
        `)
      }
      
      if (this.refreshable) {
        $btnGroup.append(`
            <button class="btn btn-default btn-refresh" type="button" title="刷新">
                <span class="glyphicon glyphicon-refresh"></span>
            </button>
        `)
      }
      
      if (this.filterable) {
        $btnGroup.append(`
          <button class="btn btn-default btn-filter" type="button" title="过滤器">
                <span class="glyphicon glyphicon-filter"></span>
          </button>
        `)
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
      this.$thead.append($tr)
      var table = this
      this.$thead.find('.btn-sort').click(function () {
        var $this   = $(this),
            sortBy  = $this.data('sort-by'),
            order   = $this.data('order')
        sort(table.data, sortBy, order == 'desc')
        table.renderData()
      })
      
      if (this.filterable) {
        var $filter = $('<tr class="data-table-filter"></tr>')
        for (var key in this.options.fields) {
          $filter.append('<th><input class="form-control" name=":name"></th>'.replace(':name', key))
        }
        this.$thead.append($filter)
        
        this.$caption.find('.btn-filter').click(function () {
          $(this).toggleClass('active')
          $filter.toggle()
          $filter.find(':input').val('')
          $filter.find(':input:first()').change()
        })
        
        this.$table.on('change keyup paste', '.data-table-filter :input', function () {
          var filterConditions = {}
          this.$table.find('.data-table-filter :input').each(function() {
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
      this.visibleData = filtrate(data || this.data, this.visibleCondition)
      var totalPage = Math.ceil(this.visibleData.length / this.pageSize)
        if (this.pageable) {
        this.visibleData = Array.prototype.slice.call(this.visibleData, (this.page - 1) * this.pageSize,
          Math.min(this.page * this.pageSize, this.visibleData.length))
      }
      this.$tbody.html('');
      for (var i in this.visibleData) {
        var $tr = $('<tr></tr>')
        for (var key in this.options.fields) {
          $tr.append('<td>' + (getValue(this.visibleData[i], key) || '') + '</td>')
        }
        this.$tbody.append($tr)
      }
      if (this.pageable) {
        this.renderPagination(totalPage)
      }
    },
    
    renderPagination: function (totalPage) {
      var nums = pageGenerator(this.page, totalPage),
        $pagination = $('<div class="data-table-pagination"></div>'),
        $pageSeleter = $('<select class="form-control data-table-page-select"></select>'),
        $pageNums = $('<ul class="pagination data-table-pagination"></ul>')
  
      $pagination.prepend('<span>:page / :totalPage</span>'.replace(':page', this.page).replace(':totalPage', totalPage))
  
      var $laquo = $('<li data-page="1"><a href="javascript:void(0);">&laquo;</a></li>')
      if (this.page == 1) {
        $laquo.addClass('disabled')
      }
      $pageNums.append($laquo)
      
      for (var i in nums) {
        var $pn = $('<li data-page=":num"><a href="javascript:void(0);">:num</a></li>'.replace(/:num/g, nums[i]))
        if (nums[i] == this.page) {
          $pn.addClass('active')
        }
        $pageNums.append($pn);
      }
      
      var $requo = $('<li data-page=":totalPage"><a href="javascript:void(0);">&raquo;</a></li>'.replace(':totalPage', totalPage))
      if (this.page == totalPage) {
        $requo.addClass('disabled')
      }
      $pageNums.append($requo)
      $pagination.append($pageNums)
  
      for (var i = 1; i <= totalPage; i++) {
        var $pageOption = $('<option value=":page">:page</option>'.replace(/:page/g, i))
        if (i == this.page) {
          $pageOption.prop('selected', true)
        }
        $pageSeleter.append($pageOption);
      }
      $pagination.append($pageSeleter)
      
      if (this.$pagination.length > 0) {
        this.$pagination.replaceWith($pagination)
        this.$pagination = $pagination
      } else {
        this.$pagination = $pagination
        this.$table.after(this.$pagination)
      }
  
      var table = this
      $pagination.on('click change', '.pagination li, .data-table-page-select', function () {
        console.log(this)
        if ($(this).is('.disabled')) return
        if ($(this).is('select')) {
          table.page = $(this).val()
        } else {
          table.page = $(this).data('page')
        }
        table.renderData()
      })
    },
    
    getData: function (idx) {
      return this.data[idx]
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
    
    event: function (type, fn) {
      var table = this
      this.$tbody.on(type, 'tr', function () {
        fn.apply(this, [table.visibleData[$(this).index()]])
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
   * @param currentPage 當前頁碼
   * @param totalPages 總頁數
   * @returns {Array} 頁碼數組
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
  
})(jQuery)