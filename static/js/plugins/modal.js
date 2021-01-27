import {sendRequest, getIDNum} from '../helpers'


const checkListItemToHTML = item => `
    <li class="checklist-item">
        <div class="checklist-item-container">
            <input type="checkbox" ${ item.done ? 'checked' : '' } />
            <textarea class="checklist-item-title" rows="1">${ item.text }</textarea>
        </div>
    </li>
`


const checkListToHTML = checkList => `
    <div class="checklist-block">
        <div class="checklist-header">
            <textarea class="checklist-title" rows="1"> ${ checkList.title } </textarea>
            <button type="button" class="modal-btn default del-checklist-btn">Удалить</button>
        </div>
        <div class="checklist-body">
            <div class="checklist-progress">
            </div>
            <div class="checklist-list-container">
                <ul class="checklist-list">
                    ${ checkList.items.map(checkListItemToHTML).join('') }
                </ul>
            </div>
        </div>
        <div class="checklist-footer">
            <button type="button" class="modal-btn default checklist-add-item-btn">Добавить элемент</button>
            <form class="checklist-add-form">
                <textarea class="checklist-add-input" placeholder="Добавить элемент"></textarea>
                <div class="checklist-add-form-btns">
                    <button type="button" class="modal-btn primary">Сохранить</button>
                    <button type="button" class="modal-btn default">&#10006;</button>
                </div>                                    
            </form>
        </div>
    </div>
`


function _createCardModal(options) {
    const modal = document.createElement('div')
    modal.classList.add('modal')
    modal.classList.add('card-modal')
    modal.insertAdjacentHTML('afterbegin', `
        <div class="modal-overlay" data-close="true">
            <div class="modal-container">
                <div class="modal-header">
                    <input class="modal-title" type="text" placeholder="Название карточки" 
                           value="${ options.card.title }">
                    <span class="modal-close" data-close="true">&#10006;</span>
                </div>
                <div class="modal-body">
                    <div class="modal-col modal-col-left">
                        <div class="modal-desc-block">
                            <h3 class="modal-desc-title">Описание</h3>
                            <textarea class="modal-description" placeholder="Добавьте более подробное описание..." 
                                      data-desc >${ options.card.description ? options.card.description : '' }</textarea>
                            <div class="modal-desc-btns">
                                <button type="button" class="modal-btn primary">Сохранить</button>
                                <button type="button" class="modal-btn default">&#10006;</button>
                            </div>
                        </div>
                        ${ 'checklists' in options.card ? options.card.checklists.map(checkListToHTML).join('') : '' }
                    </div>
                    <div class="modal-col modal-col-right">
                        <div class="modal-add-block">
                            <span class="modal-add-title">Добавить на карточку</span>
                            <button type="button" class="modal-btn default modal-mark-btn">Метку</button>
                            <button type="button" class="modal-btn default modal-checklist-btn">Чек-лист</button>
                            <button type="button" class="modal-btn default modal-datetime-btn">Срок</button>    
                        </div>
                        <div class="modal-actions-block">
                            <span class="modal-actions-title">Действия</span>
                            <button type="button" class="modal-btn default modal-move-btn">Переместить</button>
                            <button type="button" class="modal-btn default modal-copy-btn">Копировать</button>
                            <button type="button" class="modal-btn danger modal-delete-btn">Удалить</button>    
                        </div>
                    </div>
                </div>
            </div>
        </div>    
    `)
    document.body.appendChild(modal)

    return modal
}


function changeCardTitleInDB(oldTitle, newTitle, listID, cardID) {
    const body = {
        title: newTitle
    }
    const csrfToken = document.cookie.match(/csrftoken=([\w-]+)/)[1]
    const headers = {
        'X-CSRFToken':  csrfToken,
        'Content-Type': 'application/json; charset=UTF-8'
    }
    const URL = `http://127.0.0.1:8000/api/boards/1/lists/${ listID }/cards/${ cardID }/`
    sendRequest('PATCH', URL, body, headers)
        .then(data => console.log(data))
        .catch(err => console.log(err))

    changeCardTitleInList(listID, oldTitle, newTitle)
}


function changeCardTitleInList(listId, oldTitle, newTitle) {
    const list = document.getElementById('list' + listId)
    const cards = list.querySelectorAll('.card')
    cards.forEach(card => {
        if (card.innerText === oldTitle) card.innerText = newTitle
    })
}


async function changeCardDescInDB(oldDesc, newDesc, listID, cardID) {
    const body = {
        description: newDesc
    }
    const csrfToken = document.cookie.match(/csrftoken=([\w-]+)/)[1]
    const headers = {
        'X-CSRFToken':  csrfToken,
        'Content-Type': 'application/json; charset=UTF-8'
    }
    const URL = `http://127.0.0.1:8000/api/boards/1/lists/${ listID }/cards/${ cardID }/`
    await sendRequest('PATCH', URL, body, headers)
        .then(data => console.log(data))
        .catch(err => console.log(err))
}



const getCardModalMethods = $modalNode => {
    return {
        close() {
            $modalNode.classList.remove('open')
            $modalNode.classList.add('hiding')
            setTimeout( () => {
                $modalNode.classList.remove('hiding')
                this.destroy()
            }, 500)
        },
        setModalDescriptionEventListeners(options) {
            const modalDesc = $modalNode.querySelector('.modal-description')
            const modalDescBtns = $modalNode.querySelector('.modal-desc-btns')
            modalDesc.addEventListener('focus', e => modalDescBtns.style.display = 'flex')
            modalDesc.addEventListener('blur', e => {
                changeCardDescInDB(options.card.description, modalDesc.value, options.card.list, options.card.id)
                modalDescBtns.style.display = 'none'
                modalDesc.value === '' ? modalDesc.style.minHeight = '56px' : ''
            })
            modalDesc.addEventListener('input', e => {
                modalDesc.style.height = 'auto'
                modalDesc.style.height = modalDesc.scrollHeight + 'px'
            })
        },
        setChecklistsEventListeners() {
            // const itemTitles = $modalNode.querySelectorAll('.checklist-item-title')
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
            // const addItemBtn = $modalNode.querySelector('.checklist-add-item-btn')
            // addItemBtn.addEventListener('click', e => {
            //     addForm = $modalNode.querySelector('.checklist-add-form')
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

        delete(listID, cardID) {
            // 1. delete from db
            const csrfToken = document.cookie.match(/csrftoken=([\w-]+)/)[1]
            const headers = {
                'X-CSRFToken':  csrfToken,
                'Content-Type': 'application/json; charset=UTF-8'
            }
            const URL = `http://127.0.0.1:8000/api/boards/1/lists/${ listID }/cards/${ cardID }/`
            sendRequest('DELETE', URL, null, headers)
                .catch(err => console.log(err))

            // 3. delete card from DOM
            const lists = document.querySelectorAll('.list')
            for (let i = 0; i < lists.length; ++i) {
                if (getIDNum(lists[i].id) === listID) {
                    const cards = lists[i].querySelectorAll('.card')
                    for (let j = 0; j < cards.length; ++j) {
                        if (getIDNum(cards[j].id) === cardID) {
                            const cardNode = cards[j]
                            // remove all event listeners
                            const cardClone = cardNode.cloneNode(true)
                            cardNode.parentNode.replaceChild(cardClone, cardNode)
                            // remove from DOM
                            cardClone.parentNode.removeChild(cardClone)
                            break
                        }
                    }
                    break
                }
            }
            // 2. close and destroy modal
            this.close()
        }

    }
}


function _createOptionModal(options, optionsContainer) {
    const modal = document.createElement('div')
    modal.classList.add('modal')
    modal.classList.add('settings-modal')
    modal.insertAdjacentHTML('afterbegin', `
        <div class="modal-container">
            <div class="modal-header">
                <h3 class="modal-title" >Действия со списком</h3>
                <span class="modal-close" data-close="true">&#10006;</span>                
            </div>
            <div class="modal-body">
                ${ getOptionBody(options) }            
            </div>
        </div>
    `)
    optionsContainer.appendChild(modal)

    return modal
}


function getOptionBody(options) {
    const type = options.type
    switch (type) {
        case 'listSettings':
            return  getListSettingsModalBody()
        case 'marks':
            return getMarksModalBody(options)
        case 'checklist':
            return getChecklistModalBody(options)
        case 'expiration':
            return getExpirationModalBody(options)
        case 'moveCard':
            return getMoveCardModalBody(options)
        case 'copyCard':
            return getCopyCardModalBody(options)
    }
}


function getListSettingsModalBody() {
    return `
        <button>Добавить карточку</button>
        <button>Копировать список</button>
        <button>Удалить все карточки списка</button>
        <button>Удалить список</button>
    `
}


function getMarksModalBody(options) {}
function getChecklistModalBody(options) {}
function getExpirationModalBody(options) {}
function getMoveCardModalBody(options) {}
function getCopyCardModalBody(options) {}


export const modal = function(options, afterNode = null) {
    // closure -> access to private fields/methods

    // modal types:
    // 'card'
    // 'listSettings'
    // 'marks'
    // 'checklist'
    // 'expiration'
    // 'moveCard'
    // 'copyCard'

    options = typeof options !== 'undefined' ? options : {}

    const type = options.type ? options.type : 'card'
    const overlay = options.overlay ? options.overlay : true
    const animateOpenClose = options.animateOpenClose ? options.animateOpenClose : true

    let isDestroyed = false
    let $modalNode


    const modal = {
        open() {
            if (isDestroyed) return
            $modalNode.classList.add('open')
        },
        close() {
            $modalNode.classList.remove('open')
            this.destroy()
        },
        destroy() {
            const $modalClone = $modalNode.cloneNode(true)
            $modalNode.parentNode.replaceChild($modalClone, $modalNode)
            $modalClone.parentNode.removeChild($modalClone)
            isDestroyed = true
        },
    }

    if (type === 'card') {
        $modalNode = _createCardModal(options)
        Object.assign(modal, getCardModalMethods($modalNode))
        modal.setModalDescriptionEventListeners(options)
        if ('checklists' in options)
            modal.setChecklistsEventListeners()
        const modalTitle = $modalNode.querySelector('.modal-title')
        modalTitle.addEventListener('blur', e => {
            changeCardTitleInDB(options.title, modalTitle.value, options.list, options.id)
        })
        const deleteBtn = $modalNode.querySelector('.modal-delete-btn')
        deleteBtn.addEventListener('click', e => modal.delete(options.card.list, options.card.id))
    } else {
        $modalNode = _createOptionModal(options, afterNode)
    }

    $modalNode.addEventListener('click', e => (e.target.dataset.close === 'true') ? modal.close() : '')

    return modal
}



// modal -> overlay -> container -> header / body / footer
// modal -> container -> header / body / footer
// options:
// * type
// * overlay
// * animateOpenClose