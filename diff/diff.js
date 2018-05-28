function diff(oldDomTree, newDomTree) {
  let pathchs = {}
  dfs(oldDomTree, newDomTree, 0, pathchs)
  return pathchs
}

function dfs(oldNode, newNode, index, patches) {
  // 1. tagName and key is not same, replace oldNode
  // 2. node is same, but text is not same, replace text
  // 3. node is same, but props is not same, diff props
  // 4. node is same and has children, list diff children
  // 5. newNode is null, nothing to do
  let curPatches = []
  if (newNode.tag === oldNode.tag && newNode.key === oldNode.key) {
    let props = diffProps(oldNode.props, newNode.props)
    if (props.length) curPatches.push({ type: StateEnums.ChangeProps, props })
    diffChildren(oldNode.children, newNode.children, index, patches)
  } else if (!newNode) {
  } else {
    curPatches.push({ type: StateEnums.Replace, node: newNode })
  }

  if (curPatches.length) {
    if (patches[index]) {
      patches[index] = patches[index].concat(curPatches)
    } else {
      patches[index] = curPatches
    }
  }
}

function diffChildren(oldChild, newChild, index, patches) {
  let changes = listDiff(oldChild, newChild, index, patches)
  if (changes.length) {
    if (patches[index]) {
      console.log(index)
      patches[index] = patches[index].concat(changes)
    } else {
      patches[index] = changes
    }
  }
  let last = null
  oldChild &&
    oldChild.forEach((item, i) => {
      let child = last && last.children
      if (child) {
        index = index + child.length + 1
        dfs(item, newChild[i], index, patches)
      } else index += 1
      last = item
    })
}

function diffProps(oldProps, newProps) {
  // 判断 Props 分以下三步骤
  // 先遍历 oldProps 查看是否存在删除的属性
  // 然后遍历 newProps 查看是否有属性值被修改
  // 最后查看是否有属性新增
  let change = []
  for (const key in oldProps) {
    if (oldProps.hasOwnProperty(key) && !newProps[key]) {
      change.push({
        type: StateEnums.RemoveProps,
        prop: key
      })
    }
  }
  for (const key in newProps) {
    if (newProps.hasOwnProperty(key)) {
      const prop = newProps[key]
      if (oldProps[key] && oldProps[key] !== newProps[key]) {
        change.push({
          type: StateEnums.ChangeProps,
          prop: key,
          value: newProps[key]
        })
      } else if (!oldProps[key]) {
        change.push({
          type: StateEnums.AddProps,
          prop: key,
          value: newProps[key]
        })
      }
    }
  }
  return change
}

function listDiff(oldList, newList, index, patches) {
  let { keys: oldKeys, text: oldText } = getKeys(oldList)
  let { keys: newKeys, text: newText, noTextList } = getKeys(newList)
  if (isString(oldText) && isString(newText) && oldText !== newText) {
    patches[index] = [{ type: StateEnums.ChangeText, text: newText }]
  }
  let changes = []
  let node = null
  // 用于减少不必要的移动
  // 可以考虑以下情况
  // oldKeys: 1, 2, 3, 4
  // newkeys: 5, 1, 2, 3, 4
  // 对于以上情况，5 插入到首位以后，后面的元素相对于
  // newkeys 中的位置是不变的，所以不需要移动
  // 如果只是单纯的去判断元素在新旧中的位置是否相同
  // 而决定是否移动的话，其实是不必要的
  let lastIndex = 0

  newKeys.forEach(key => {
    // 寻找旧的 children 中是否含有当前节点
    let index = oldKeys.indexOf(key)
    // 没找到代表新节点，需要插入
    if (index === -1) {
      changes.push({
        type: StateEnums.Insert,
        node: noTextList[newKeys.indexOf(key)],
        after: node
      })
    } else {
      // 找到了，需要判断是否需要移动
      if (index < lastIndex) {
        changes.push({
          type: StateEnums.Move,
          node: noTextList[newKeys.indexOf(key)],
          after: node
        })
      }
      lastIndex = Math.max(lastIndex, index)
    }
    node = key
  })

  oldKeys.forEach(key => {
    // 寻找新的 children 中是否含有当前节点
    // 没有的话需要删除
    let index = newKeys.indexOf(key)
    if (index === -1) {
      changes.push({
        type: StateEnums.Remove,
        key
      })
    }
  })

  return changes
}

function getKeys(list) {
  let keys = []
  let noTextList = []
  let text = ''
  let length = list && list.length
  for (let i = 0; i < length; i++) {
    let item = list[i]
    if (item instanceof Element) {
      keys.push(item.key)
      noTextList.push(item)
    } else {
      text += item
    }
  }
  return { keys, text, noTextList }
}

let test3 = new Element('div', { class: 'my-div' }, 'test3')
let test4 = new Element('div', { class: 'my-div' }, 'test4')
let test5 = new Element('div', { class: 'my-div' }, 'test5')
let test1 = new Element('div', { class: 'my-div' }, ['test1', test3])

let test2 = new Element('div', { class: 'my-div' }, [
  'test2',
  test4,
  test5,
  test3
])

console.log(diff(test1, test2))
// export default diff
