function _createModal(options) {

    options = typeof options === 'undefined' ? {} : options

    const modal = document.createElement('div')
    modal.classList.add('modal')
    modal.insertAdjacentHTML('afterbegin', `
        <div class="modal-overlay" data-close="true">
            <div class="modal-container">
                <div class="modal-header">
                    <input class="modal-title" type="text" placeholder="Название карточки" 
                    value="${ options.hasOwnProperty('title') ? options.title : 'Название карточки' }">
                    <span class="modal-close" data-close="true">&#10006;</span>
                </div>
                <div class="modal-body">
                    <div class="modal-col modal-col-left">
                        <div class="modal-desc-block">
                            <h3 class="modal-desc-title">Описание</h3>
                            <textarea class="modal-description" placeholder="Добавьте более подробное описание..." data-desc >
${ options.description ? options.description : '' }</textarea>
                            <div class="modal-desc-btns">
                                <button type="button" class="modal-btn primary">Сохранить</button>
                                <button type="button" class="modal-btn default">&#10006;</button>
                            </div>
                        </div>

                        <div class="checklist-block">
                            <div class="checklist-header">
                                <textarea class="checklist-title" rows="1">Чек-лист</textarea>
                                <button type="button" class="modal-btn default del-checklist-btn">Удалить</button>
                            </div>
                            <div class="checklist-body">
                                <div class="checklist-progress">
                                </div>
                                <div class="checklist-list-container">
                                    <ul class="checklist-list">
                                      
                                        <li class="checklist-item">
                                            <div class="checklist-item-container">
                                                <input type="checkbox" />
                                                <textarea class="checklist-item-title" rows="1">
1
                                                </textarea>
                                            </div>
                                        </li>

                                        <li class="checklist-item">
                                            <div class="checklist-item-container">
                                                <input type="checkbox" />
                                                <textarea class="checklist-item-title" rows="1">
2
                                                </textarea>
                                            </div>
                                        </li>

                                    </ul>
                                </div>
                            </div>
                            <div class="checklist-footer">
                                <button type="button" class="modal-btn default checklist-add-item-btn">Добавить элемент</button>
                                <form class="checklist-add-form">
                                    <textarea class="checklist-add-input" 
                                              placeholder="Добавьте более подробное описание..."></textarea>
                                    <div class="checklist-add-form-btns">
                                        <button type="button" class="modal-btn primary">Сохранить</button>
                                        <button type="button" class="modal-btn default">&#10006;</button>
                                    </div>                                    
                                </form>
                            </div>
                        </div>

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


$.modal = function(options) {
    // closure -> access to private fields/methods

    const $modalNode = _createModal(options)
    let isClosing = false
    let isDestroyed = false

    const modal = {
        open() {
            if (isDestroyed) return
            !isClosing && $modalNode.classList.add('open')
        },
        close() {
            isClosing = true
            $modalNode.classList.remove('open')
            $modalNode.classList.add('hiding')     
            setTimeout( () => {
                isClosing = false
                $modalNode.classList.remove('hiding')
                this.destroy()
            }, 500)
        },
        destroy() {
            const $modalClone = $modalNode.cloneNode(true)
            $modalNode.parentNode.replaceChild($modalClone, $modalNode)
            $modalClone.parentNode.removeChild($modalClone)
            isDestroyed = true
        },
        setHTML(html){
            $modalNode.querySelector('[data-desc]').innerHTML = html
        }
    }

    $modalNode.addEventListener('click', e => (e.target.dataset.close === 'true') ? modal.close() : '')
    const modalDesc = $modalNode.querySelector('.modal-description')
    const modalDescBtns = $modalNode.querySelector('.modal-desc-btns')
    modalDesc.addEventListener('focus', e => modalDescBtns.style.display = 'flex')
    modalDesc.addEventListener('blur', e => {
        modalDescBtns.style.display = 'none'
        modalDesc.value === '' ? modalDesc.style.minHeight = '56px' : ''
    })
    modalDesc.addEventListener('input', e => {
        modalDesc.style.height = 'auto'
        modalDesc.style.height = modalDesc.scrollHeight + 'px'
    })
    $modalNode.querySelectorAll('.checklist-item-title').forEach(item => {
        item.addEventListener('focus', e => {
            item.style.minHeight = '56px'
            item.style.padding = '8px 12px'
            item.parentNode.parentNode.insertAdjacentHTML('beforeend', `
                <div class="checklist-item-btns">
                    <button type="button" class="modal-btn primary">Сохранить</button>
                    <button type="button" class="modal-btn default">&#10006;</button>
                </div>
            `)
        })
        item.addEventListener('blur', e => {
            item.style.minHeight = '25.6px'
            item.style.padding = '4px 8px'
            itemNode = item.parentNode.parentNode
            itemNode.removeChild(itemNode.children[itemNode.children.length - 1])
        })
    })
    const addItemBtn = $modalNode.querySelector('.checklist-add-item-btn')
    addItemBtn.addEventListener('click', e => {
        addForm = $modalNode.querySelector('.checklist-add-form')
        addForm.style.display = 'block'
        addItemBtn.style.display = 'none'
        input = addForm.querySelector('.checklist-add-input')
        input.focus()
        input.addEventListener('blur', e => {
            addForm.style.display = 'none'
            addItemBtn.style.display = 'block'
        })
    })

    return modal
}