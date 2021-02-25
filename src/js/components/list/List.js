import {BaseComponent} from '../../core/BaseComponent';
import {Card} from '../card/Card';
import {dom} from '../../core/DOM';
import {sendRequest, isValidTitle, getIDNum} from '../../helpers';
// import {listToHTML} from '../../html';
import {getOnDragover} from '../../drag-n-drop';
import {createModal} from '../../plugins/modal';

export class List extends BaseComponent {
  constructor(options) {
    const componentNode = dom.create(
        'div',
        `list${ options.data.id }`,
        'list',
        {'draggable': true}
    )
    super(componentNode, {
      name: 'List',
      listeners: ['click', 'dragover', 'dragstart', 'dragend'],
      ...options,
    })
  }

  init() {
    super.init()
    this.on('List:dragstart', () => this.removeListener('dragover'))
    this.on('List:dragend', () => this.addListener('dragover'))
  }

  render() {
    this.rootNode.innerHTML = this.toHTML(this.data)
    const data = {}
    this.data['cards'].forEach((card, idx) => {
      data[idx] = card
      this.components.push(Card)
    })
    const listBody = this.rootNode.querySelector('.list__body')
    this.renderInnerComponents(data, listBody)
  }

  toHTML(list) {
    return `
        <div class="list__header">
            <input type="text" class="list__title" value="${ list.title }">
            <div class="options-container">
                <img src="img/list-settings.png" alt="options" class="list__options">
            </div>
        </div>
        <div class="list__body">
        </div>
        <div class="list__footer">
            <button class="add-card-btn">
                Добавить карточку
            </button>
        </div>
    `
  }

  showNewListTitleInput(listBody) {
    const textArea = dom.create(
        'textarea',
        '',
        'add-card-text',
        {
          'placeholder': 'Введите заголовок для этой карточки',
          'rows': 3,
        }
    )

    textArea.addEventListener('keyup', (e) => {
      (e.key === 13) ? textArea.blur() : {}
    })

    textArea.addEventListener('blur', () => {
      // addCardOrHideTextArea
      const listBody = textArea.parentNode
      const title = textArea.value
      if (isValidTitle(title)) {
        // rewrite
        // createCard(e, title, listBody, this).then( () => {
        //   this.value = ''
        //   this.focus()
        // })
      } else listBody.removeChild(textArea)
      listBody.scrollTop = listBody.scrollHeight
    })

    listBody.appendChild(textArea)
    textArea.focus()
    listBody.scrollTop = listBody.scrollHeight
  }

  async create(title) {
    // create in DB
    // const body = {
    //   board: 1,
    //   title: title,
    // }
    // const url = `boards/1/lists/`
    // const createdList = await sendRequest('POST', url, body)

    // create in DOM
    // const newList = HTMLToNode(listToHTML(createdList))
    // const lists = document.querySelectorAll('.list')
    // addListEvents(newList, lists)
    // newList.querySelector('.add-card-btn').addEventListener('click', this.showNewListTitleInput)

    // return newList
  }

  // listener's methods
  onClick(event) {
    const cardNode = dom.findParentNodeWithTheClass(event.target, 'card', this.rootNode)
    const isAddCardBtn = event.target.classList.contains('add-card-btn')
    const isOptions = event.target.classList.contains('list__options')

    if (cardNode) {
      const cardID = getIDNum(cardNode.id)
      const listID = getIDNum(this.rootNode.id)
      showCardModal(listID, cardID)
    } else if (isAddCardBtn) {
      const listBody = this.rootNode.querySelector('.list__body')
      this.showNewListTitleInput(listBody)
    } else if (isOptions) {
      const settingsContainer = event.target.parentNode
      if (settingsContainer.children.length === 1) {
        showSettingsModal(event, settingsContainer)
      } else {
        const modalNode = event.target.parentNode.querySelector('.list-settings-modal')
        // remove all event listeners
        const modalClone = modalNode.cloneNode(true)
        modalNode.parentNode.replaceChild(modalClone, modalNode)
        // remove from DOM
        modalClone.parentNode.removeChild(modalClone)
      }
    }
  }

  onDragover = getOnDragover(
      () => this.rootNode.querySelector('.list__body'),
      'y',
      '.card',
      '.dragging'
  )

  onDragstart() {
    this.dispatch('List:dragstart')
    this.rootNode.classList.add('dragging-list')
  }

  onDragend() {
    this.dispatch('List:dragend')
    this.rootNode.classList.remove('dragging-list')
  }
}


// Modals
async function showCardModal(listID, cardID) {
  const url = `boards/1/lists/${listID}/cards/${cardID}/`
  const card = await sendRequest('GET', url)
  const options = {
    type: 'card',
    card: card,
  }
  createModal(options)
}


function showSettingsModal(e, settingsContainer) {
  const listNode = e.target.parentNode.parentNode.parentNode
  const listID = getIDNum(listNode.id)
  const options = {
    type: 'listSettings',
    listID: listID,
    container: settingsContainer,
  }
  createModal(options)
}

/* TODO:
* save dropped list in position (update db)
* save dropped card in list (update db): delete from one list + add copy to another
* copy list +- (fix marks & checklists copying)
**/
