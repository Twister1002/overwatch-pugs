import React, {useState, useEffect} from "react";

import "../../css/modal.min.css";

const Modal = function(props: {
    children: JSX.Element
}) {

    return (
        <div id="modal-background">
            <div id="modal">
                {props.children}
            </div>
        </div>
    )

}

export default Modal;