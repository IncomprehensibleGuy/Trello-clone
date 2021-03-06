import {
  getCardModalInnerHTML,
  getOptionModalInnerHTML,
} from './modal.html';
import {sendRequest, getIDNum} from '../helpers';
import {dom} from '../core/DOM';

async function createMark(listID, cardID, color) {
  // create mark in db +
  const body = {
    card: cardID,
    title: color,
  }
  const url = `boards/1/lists/${listID}/cards/${cardID}/marks/`
  await sendRequest('POST', url, body)

  // draw mark on modal +
  const cardModal = document.querySelector('.card-modal')
  const cardColLeft = cardModal.querySelector('.modal-marks-block')
  const mark = document.createElement('div')
  mark.classList.add('mark-color', color)
  cardColLeft.append(mark)

  // draw mark on card +
  const card = document.querySelector('#card' + cardID)
  const marksContainer = card.querySelector('.card-marks-container')
  const markHTML = `<div class="card-mark-color ${color}"></div>`
  marksContainer.append(dom.HTMLToNode(markHTML))

  // add checked element +
  const marksModal = document.querySelector('.marks-modal')
  marksModal.querySelector('.' + color).innerHTML = '<div class="mark-color-checked"></div>'
}


async function deleteMark(listID, cardID, color, marks) {
  // delete from db +
  const markID = marks.filter((mark) => mark.title === color)[0].id
  const url = `boards/1/lists/${ listID }/cards/${ cardID }/marks/${markID}/`
  sendRequest('DELETE', url, null).catch((err) => console.log(err))

  // delete from modal +
  const cardModal = document.querySelector('.card-modal')
  const cardColLeft = cardModal.querySelector('.modal-marks-block')
  const modalMarksBlock = cardModal.querySelector('.modal-marks-block')
  const mark = modalMarksBlock.querySelector('.mark-color.' + color)
  cardColLeft.removeChild(mark)

  // delete from card +
  const card = document.querySelector('#card' + cardID)
  const marksContainer = card.querySelector('.card-marks-container')
  const cardMark = marksContainer.querySelector('.' + color)
  marksContainer.removeChild(cardMark)

  // delete checked element +
  const marksModal = document.querySelector('.marks-modal')
  marksModal.querySelector('.' + color).innerHTML = ''
}


function createOrDeleteMark(listID, cardID) {
  // closure for passing args in callback function
  return async (e) => {
    const color = e.target.classList[1]

    const getMarksURL = `boards/1/lists/${listID}/cards/${cardID}/marks`
    const marks = await sendRequest('GET', getMarksURL)
    for (const mark of marks) {
      if (mark.title === color) {
        await deleteMark(listID, cardID, color, marks)
        return
      }
    }

    await createMark(listID, cardID, color)
  }
}


async function getMarks(listID, cardID) {
  const getMarksURL = `boards/1/lists/${listID}/cards/${cardID}/marks/`
  return await sendRequest('GET', getMarksURL)
}


function _createModalNode(options, modalObj) {
  const modalNode = document.createElement('div')
  modalNode.classList.add('modal')

  if (options.type !== 'card') {
    modalNode.insertAdjacentHTML('afterbegin', getOptionModalInnerHTML(options.type, options.title))
  }

  switch (options.type) {
    case 'card': {
      console.log(options.card.position)
      modalNode.id = 'cardModal' + options.card.id
      modalNode.classList.add('card-modal')
      modalNode.insertAdjacentHTML('afterbegin', getCardModalInnerHTML(options.card))
      document.body.appendChild(modalNode)
      // Events
      Object.assign(modalObj, getCardModalMethods(modalNode))
      modalObj.setModalDescriptionEventListeners(options)
      if ('checklists' in options.card) {
        modalObj.setChecklistsEventListeners()
      }
      const modalTitle = modalNode.querySelector('.modal-title')
      modalTitle.addEventListener('blur', (e) => {
        const body = {
          title: modalTitle.value,
        }
        const listID = options.card.list
        const cardID = options.card.id
        const url = `boards/1/lists/${listID}/cards/${cardID}/`
        sendRequest('PATCH', url, body).catch((err) => console.log(err))
        const cardNode = document.getElementById('card'+cardID)
        cardNode.innerText = modalTitle.value
      })
      const markBtn = modalNode.querySelector('.modal-mark-btn')
      markBtn.addEventListener('click', (e) => {
        createModal({
          type: 'marks',
          container: e.target.parentNode,
          listID: options.card.list,
          cardID: options.card.id,
          title: 'Метки',
        })
      })
      const checklistBtn = modalNode.querySelector('.modal-checklist-btn')
      checklistBtn.addEventListener('click', (e) => {
        createModal({
          type: 'checklist',
          container: e.target.parentNode,
          title: 'Добавление списка задач',
        })
      })
      const expirationBtn = modalNode.querySelector('.modal-datetime-btn')
      expirationBtn.addEventListener('click', (e) => {
        createModal({
          type: 'expiration',
          container: e.target.parentNode,
          title: 'Изменение даты выполнения',
        })
      })
      const moveBtn = modalNode.querySelector('.modal-move-btn')
      moveBtn.addEventListener('click', (e) => {
        createModal({
          type: 'moveCard',
          container: e.target.parentNode,
          title: 'Перемещение карточки',
        })
      })
      const copyBtn = modalNode.querySelector('.modal-copy-btn')
      copyBtn.addEventListener('click', (e) => {
        createModal({
          type: 'copyCard',
          container: e.target.parentNode,
          title: 'Копирование карточки',
        })
      })
      const deleteBtn = modalNode.querySelector('.modal-delete-btn')
      deleteBtn.addEventListener('click', (e) => {
        createModal({
          type: 'deleteCard',
          container: e.target.parentNode,
          title: 'Вы действительно хотите удалить карточку?',
          cardModalObj: modalObj,
          listID: options.card.list,
          cardID: options.card.id,
          event: e,
        })
      })
      break
    }
    case 'listSettings':
      modalNode.classList.add('list-settings-modal')
      options.container.appendChild(modalNode)
      Object.assign(modalObj, getListSettingsModalMethods(modalNode, options.listID))
      modalObj.setEventListeners(modalNode)
      break
    case 'marks': {
      modalNode.classList.add('marks-modal')
      document.querySelector('.marks-container').appendChild(modalNode)
      const marks = modalNode.querySelectorAll('.mark-color')
      getMarks(options.listID, options.cardID)
          .then( (marksColors) => {
            marks.forEach((mark) => {
              const markColor = mark.classList[1]
              marksColors.forEach((color) => {
                if (color.title === markColor) {
                  mark.innerHTML = '<div class="mark-color-checked"></div>'
                }
              })
              mark.addEventListener('click', createOrDeleteMark(options.listID, options.cardID))
            })
          })
      break
    }
    case 'checklist':
      modalNode.classList.add('checklist-modal')
      document.querySelector('.checklist-container').appendChild(modalNode)
      break
    case 'expiration':
      modalNode.classList.add('expiration-modal')
      document.querySelector('.datetime-container').appendChild(modalNode)
      break
    case 'moveCard':
      modalNode.classList.add('move-card-modal')
      options.container.appendChild(modalNode)
      break
    case 'copyCard':
      modalNode.classList.add('copy-card-modal')
      options.container.appendChild(modalNode)
      break
    case 'deleteCard': {
      modalNode.classList.add('delete-card-modal')
      const deleteButton = modalNode.querySelector('.delete-card-ok')
      deleteButton.addEventListener('click', (e) => {
        options.cardModalObj.delete(options.listID, options.cardID, e)
      })
      const cancelButton = modalNode.querySelector('.delete-card-cancel')
      cancelButton.addEventListener('click', (e) => {
        modalObj.close(e)
      })
      options.container.appendChild(modalNode)
      break
    }
    default:
      console.log('invalid type of modal')
  }

  return modalNode
}


const getCardModalMethods = (modalNode) => {
  return {
    close(e) {
      modalNode.classList.remove('open')
      modalNode.classList.add('hiding')
      setTimeout( () => {
        modalNode.classList.remove('hiding')
        this.destroy()
      }, 500)
      e.stopPropagation()
    },
    setModalDescriptionEventListeners(options) {
      const modalDesc = modalNode.querySelector('.modal-description')
      const modalDescBtns = modalNode.querySelector('.modal-desc-btns')
      modalDesc.addEventListener('focus', (e) => {
        const clearBtn = modalDescBtns.querySelectorAll('button')[1]
        clearBtn.addEventListener('click', (e) => modalDesc.value = '')
        modalDescBtns.style.display = 'flex'
      })
      modalDesc.addEventListener('blur', (e) => {
        modalDescBtns.style.display = 'none'
        if (options.card.description === modalDesc.value) return
        const cardID = options.card.id
        const listID = options.card.list
        const body = {
          description: modalDesc.value,
        }
        const url = `boards/1/lists/${ listID }/cards/${ cardID }/`
        sendRequest('PATCH', url, body).catch((err) => console.log(err))
                modalDesc.value === '' ? modalDesc.style.minHeight = '56px' : ''
      })
      modalDesc.addEventListener('input', (e) => {
        modalDesc.style.height = 'auto'
        modalDesc.style.height = modalDesc.scrollHeight + 'px'
      })
    },
    setChecklistsEventListeners() {
      // const itemTitles = modalNode.querySelectorAll('.checklist-item-title')
      // itemTitles.forEach(title => {
      //     title.addEventListener('focus', e => {
      //         title.style.minHeight = '56px'
      //         title.style.padding = '8px 12px'
      //         const item = title.parentNode.parentNode
      //         item.insertAdjacentHTML('beforeend', `
      //             <div class="checklist-item-btns">
      //                 <button type="button" class="modal-btn primary">Сохранить</button>
      //                 <button type="button" class="modal-btn default">&#10006;</button>
      //             </div>
      //         `)
      //     })
      //     title.addEventListener('blur', e => {
      //         title.style.minHeight = '25.6px'
      //         title.style.padding = '4px 8px'
      //         const item = title.parentNode.parentNode
      //         item.removeChild(item.children[item.children.length - 1])
      //     })
      // })
      // const addItemBtn = modalNode.querySelector('.checklist-add-item-btn')
      // addItemBtn.addEventListener('click', e => {
      //     addForm = modalNode.querySelector('.checklist-add-form')
      //     addForm.style.display = 'block'
      //     addItemBtn.style.display = 'none'
      //     input = addForm.querySelector('.checklist-add-input')
      //     input.focus()
      //     input.addEventListener('blur', e => {
      //         addForm.style.display = 'none'
      //         addItemBtn.style.display = 'block'
      //     })
      // })
    },
    setChecklistItemsEventListeners() {},
    delete(listID, cardID, e) {
      const url = `boards/1/lists/${ listID }/cards/${ cardID }/`
      sendRequest('DELETE', url, null).catch((err) => console.log(err))
      this.close(e)
      deleteFromDOMbyID('card'+cardID)
    },
  }
}


const getListSettingsModalMethods = (modalNode, listID) => {
  return {
    setEventListeners() {
      const addCardBtn = modalNode.querySelector('.settings-modal-add-card-btn')
      addCardBtn.addEventListener('click', (e) => {
        this.close(e)
        const list = document.getElementById('list'+listID)
        const addCardBtn = list.querySelector('.add-card-btn')
        addCardBtn.click()
      })
      const copyListBtn = modalNode.querySelector('.settings-modal-copy-list-btn')
      copyListBtn.addEventListener('click', async (e) => {
        const title = document.getElementById('list'+ listID).querySelector('.list__title').value
        // create list in DB: +
        const body = {
          board: 1,
          title: title,
        }
        const url = `boards/1/lists/`
        const createdList = await sendRequest('POST', url, body)
        // create list in DOM
        const createdListNode = createListInDOM(createdList)
        // create list cards in DB: +/-
        const getCardsURL = `boards/1/lists/${listID}/cards/`
        const cards = await sendRequest('GET', getCardsURL)
        for (let i = 0; i < cards.length; ++i) {
          const body = cards[i]
          delete body.id
          delete body.marks // to fix: create marks
          delete body.checklists // to fix: create checklists
          body.list = createdList.id
          const url = `boards/1/lists/${ body.list }/cards/`
          const createdCard = await sendRequest('POST', url, body)
          const cardNode = createCardInDOM(createdCard)
          const listBody = createdListNode.querySelector('.list__body')
          listBody.appendChild(cardNode)
        }
        // add to board
        const board = document.querySelector('.board')
        const addListBlock = board.querySelector('.add-list-block')
        board.insertBefore(createdListNode, addListBlock)
        board.scrollLeft = board.scrollWidth
        this.close(e)
      })
      const delAllCardsBtn = modalNode.querySelector('.settings-modal-delete-all-cards-btn')
      delAllCardsBtn.addEventListener('click', (e) => {
        const listNode = document.getElementById('list' + listID)
        const cardNodes = listNode.querySelectorAll('.card')
        const ids = Array.from(cardNodes).map((card) => card.id)
        ids.forEach((idStr) => {
          const cardID = getIDNum(idStr)
          const url = `boards/1/lists/${ listID }/cards/${ cardID }/`
          sendRequest('DELETE', url, null).catch((err) => console.log(err))
          deleteFromDOMbyID('card' + cardID)
        })
        this.close(e)
      })
      const delListBtn = modalNode.querySelector('.settings-modal-delete-list-btn')
      delListBtn.addEventListener('click', (e) => {
        const url = `boards/1/lists/${ listID }/`
        sendRequest('DELETE', url, null).catch((err) => console.log(err))
        deleteFromDOMbyID('list' + listID)
      })
    },
  }
}


export const createModal = function(options) {
  // modal types:
  // 'card'
  // 'listSettings'
  // 'marks'
  // 'checklist'
  // 'expiration'
  // 'moveCard'
  // 'copyCard'
  // 'deleteCard'

  let isDestroyed = false
  const modalObj = {
    open() {
      if (isDestroyed) return
      modalNode.classList.add('open')
    },
    close(e) {
      modalNode.classList.remove('open')
      this.destroy()
      e.stopPropagation()
    },
    destroy() {
      const $modalClone = modalNode.cloneNode(true)
      modalNode.parentNode.replaceChild($modalClone, modalNode)
      $modalClone.parentNode.removeChild($modalClone)
      isDestroyed = true
    },
  }
  const modalNode = _createModalNode(options, modalObj)

  modalNode.addEventListener('click', (e) => {
    (e.target.dataset.close === 'true') ? modalObj.close(e) : ''
  })
  // as DOM operation are async we need to use setTimeout to see opening animation
  setTimeout( () => modalObj.open(), 0)

  return modalObj
}

// options:
// * type
// * overlay
// * animateOpenClose

/* TODO
* checklist modal
* checklist progress bar
* add checklist
* remove checklist
* expiration modal
* add expiration
* remove expiration
* move card modal
* move card
* copy card modal
* copy card
* delete card modal +
* mark card as done
* */
