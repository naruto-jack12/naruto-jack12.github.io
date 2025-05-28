const container = document.querySelector('.container');
let source;

container.ondragstart = (e) => {
    e.dataTransfer.effectAllowed = e.target.dataset.effect;
    source = e.target;
    // console.log('start', e.target);
}

container.ondragover = (e) => {
    e.preventDefault();
    // console.log('over', e.target);
}

function clearStyle() {
    document.querySelectorAll('.drop-over').forEach((el) => {
        el.classList.remove('drop-over');
    });
}

function getDropNode(node) {
    while (node) {
        if (node.dataset.allow) {
            return node;
        }

        node = node.parentNode;
    }
}

container.ondragenter = (e) => {
    // console.log('enter', e.target);
    clearStyle();
    const node = getDropNode(e.target);
    if(!node){
        return;
    }
    if(source.dataset.effect === node.dataset.allow) {
        node.classList.add('drop-over');
    }
}
    

container.ondragleave = (e) => {
    // console.log('leave', e.target);
}

container.ondrop = (e) => {
    // console.log('drop', e.target);
    clearStyle();
    const node = getDropNode(e.target);
    if(!node){
        return;
    }
    if(source.dataset.effect !== node.dataset.allow) {
        return;
    }

    if(node.dataset.allow === 'copy') {
        node.innerHTML = '';
        const cloned = source.cloneNode(true);
        cloned.dataset.effect = 'move';
        node.appendChild(cloned);
    }else {
        source.remove();
    }

}
