pragma solidity ^0.4.18;

import './_MathHelper.sol';

/**
 * @title Grove Library - Queriable indexed ordered data tree.
 */
library GroveLib {
    /**
     * testnet:
     * mainnet:
     */
    using MathHelper for *;
    
    /// Indexes for ordered data.
    struct Index {
        bytes32 root;
        mapping (bytes32 => Node) nodes;
    }

    /// Node containing some value of type uint and references
    ///  to its children/parent.
    struct Node {
        bytes32 id;
        uint value;
        bytes32 parent;
        bytes32 left;
        bytes32 right;
        uint height;
    }

    /**
     * @dev Get the unique identifier of the node.
     * @param _index The index of that node.
     * @param _id The id of the node to be looked up.
     */
    function getNodeId(Index storage _index, bytes32 _id)
        public constant returns (bytes32)
    {
        return _index.nodes[_id].id;
    }

    /**
     * @dev Retieve the value of a node.
     * @param _index The index of that node.
     * @param _id The id of the node to be looked up.
     */
    function getNodeValue(Index storage _index, bytes32 _id)
        public constant returns (uint)
    {
        return _index.nodes[_id].value;
    }

    /** 
     * @dev Retrieve the height of the node.
     * @param _index The index of that node.
     * @param _id The id of the node to be looked up.
     */
    function getNodeHeight(Index storage _index, bytes32 _id)
        public constant returns (uint)
    {
        return _index.nodes[_id].height;
    }

    /**
     * @dev Retrieve the parent id of the node.
     * @param _index The index of that node.
     * @param _id The id of the node to be looked up.
     */
    function getNodeParent(Index storage _index, bytes32 _id)
        public constant returns (bytes32)
    {
        return _index.nodes[_id].parent;
    }

    /**
     * @dev Retrieve the parent id of the node.
     * @param _index The index of that node.
     * @param _id The id of the node to be looked up.
     */
    function getNodeLeftChild(Index storage _index, bytes32 _id)
        public constant returns (bytes32)
    {
        return _index.nodes[_id].left;
    }

    /**
     * @dev Retrieve the parent id of the node.
     * @param _index The index of that node.
     * @param _id The id of the node to be looked up.
     */
    function getNodeRightChild(Index storage _index, bytes32 _id)
        public constant returns (bytes32)
    {
        return _index.nodes[_id].right;
    }

    /**
     * @dev Retrieve the node id of the previous node in the tree.
     * @param _index The index of that node.
     * @param _id The id of the node to be looked up.
     */
    function getPreviousNode(Index storage _index, bytes32 _id)
        public constant returns (bytes32)
    {
        Node storage currentNode = _index.nodes[_id];

        if (currentNode.id == 0x0) {
            // Unkown node
            return 0x0;
        }

        Node memory child;

        if (currentNode.left != 0x0) {
            // Trace left to latest child in left tree.
            child = _index.nodes[currentNode.left];

            while (child.right != 0) {
                child = _index.nodes[child.right];
            }
            return child.id;
        } 

        if (currentNode.parent != 0x0) {
            // Trace back up through the parent relationships
            //  looking for a link where the child is the right
            //  child of it's parent.
            Node storage parent = _index.nodes[currentNode.parent];
            child = currentNode;

            while (true) {
                if (parent.right == child.id) {
                    return parent.id;
                }

                if (parent.parent == 0x0) {
                    break;
                }
                child = parent;
                parent = _index.nodes[parent.parent];
            }
        }

        // This is the first node and has no previous nodes.
        return 0x0;
    }

    /**
     * @dev Get the node id of the next node in the tree.
     * @param _index The index of the node.
     * @param _id The id of the node being looked up.
     */
    function getNextNode(Index storage _index, bytes32 _id)
        public constant returns (bytes32)
    {
        Node storage currentNode = _index.nodes[_id];

        if (currentNode.id == 0x0) {
            // Unkown node
            return 0x0;
        }

        Node memory child;

        if (currentNode.right != 0x0) {
            // Trace right to earliest child in the tree.
            child = _index.nodes[currentNode.right];

            while (child.left != 0) {
                child = _index.nodes[child.left];
            }
            return child.id;
        }

        if (currentNode.parent != 0x0) {
            // If the node is the left child of its parent,
            //  then the parent is the next one.
            Node storage parent = _index.nodes[currentNode.parent];
            child = currentNode;

            while (true) {
                if (parent.left == child.id) {
                    return parent.id;
                }

                if (parent.parent == 0x0) {
                    break;
                }
                child = parent;
                parent = _index.nodes[parent.parent];
            }
        }

        // This is the final node.
        return 0x0;
    }

    /**
     * @dev Updates or inserts the id into the index at its appropriate
     *       location based on the value provided.
     * @param _index The index that the node is part of.
     * @param _id The unique identifier of the data element of the node.
     * @param _value The value of the data element that represents its
     *                ordering with respect to other elements.
     */
    function insert(Index storage _index, bytes32 _id, uint _value)
        public returns (bool)
    {
        if (_index.nodes[_id].id == _id) {
            // A node with this _id already exists. If the value is
            //  the same, then return early, otherwise, remove it
            //  and reinsert it.
            if (_index.nodes[_id].value == _value) {
                return;
            }
            remove(_index, _id);
        }

        uint leftHeight;
        uint rightHeight;

        bytes32 previousNodeId = 0x0;

        if (_index.root == 0x0) {
            _index.root = _id;
        }

        Node storage currentNode = _index.nodes[_index.root];

        // DO insertion.
        while (true) {
            if (currentNode.id == 0x0) {
                // This is a new unpopulated node.
                currentNode.id = _id;
                currentNode.parent = previousNodeId;
                currentNode.value = _value;
                return true;
            }

            // Set the previous node id.
            previousNodeId = currentNode.id;

            // The new node belongs in the right subtree.
            if (_value >= currentNode.value) {
                if (currentNode.right == 0x0) {
                    crrentNode.right = _id;
                }
                currentNode = _index.nodes[currentNode.right];
                continue;
            }

            // The new node belongs in the left subtree.
            if (currentNode.left == 0x0) {
                currentNode.left = _id;
            }
            currentNode = _index.nodes[currentNode.left];
        }

        // Rebalance the tree.
        _rebalanceTree(_index, currentNode.id);

        return true;
    }

    /**
     * @dev Remove the node for the given identifier from the index.
     * @param _index The index that should be removed.
     * @param _id The unique identifier of the data element to remove.
     */
    function remove(Index storage _index, bytes32 _id)
        public returns (bool)
    {
        Node storage replacementNode;
        Node storage parent;
        Node storage child;

        bytes32 rebalanceOrigin;

        Node storage nodeToDelete = _index.nodes[_id];

        if (nodeToDelete.id != _id) {
            // The _id does not exist in this tree.
            return false;
        }

        if (nodeToDelete.left != 0x0 || nodeToDelete.right != 0x0) {
            // This node is not a leaf node and must replace itself
            //  in its tree by the previous or next node.
            if (nodeToDelete.left != 0x0) {
                // This node is guranteed to not have a right child.
                replacementNode = _index.nodes[getPreviousNode(_index, nodeToDelete.id)];
            } else {
                // This node is guranteed to not have a left child.
                replacementNode = _index.nodes[getNextNode(_index, nodeToDelete.id)];
            }

            // The replacement node is guranteed to have a parent.
            parent = _index.nodes[replacementNode.parent];

            // Keep note of the location that our tree rebalancing should
            //  start at.
            rebalanceOrigin = replacementNode.id;

            // Join the parent of the replacement node with any subtree of
            //  the replacement node. We can gurantee that the replacement
            //  node has at most one subtree because of how getNextNode and 
            //  getPreviousNode are used.
            if (parent.left == replacementNode.id) {
                parent.left = replacementNode.right;
                if (replacementNode.right != 0x0) {
                    child = _index.nodes[replacementNode.right];
                    child.parent = parent.id;
                }
            }

            if (parent.right == replacementNode.id) {
                parent.right = replacementNode.left;
                if (replacementNode.left != 0x0) {
                    child = _index.nodes[replacementNode.left];
                    child.parent = parent.id;
                }
            }

            // Now we replace the nodeToDelete with the replacementNode.
            //  This includes parent/child relationships for all of the
            //  parent, the left child, and the right child.
            replacementNode.parent = nodeToDelete.parent;
            if (nodeToDelete.parent != 0x0) {
                parent = _index.nodes[nodeToDelete.parent];
                if (parent.left == nodeToDelete.id) {
                    parent.left = replacementNode.id;
                }
                if (parent.right == nodeToDelete.id) {
                    parent.right = replacementNode.id;
                }
            } else {
                // If the node we are deleting is the root node, update
                //  the index root node pointer.
                _index.root = replacementNode.id;
            }

            replacementNode.left = nodeToDelete.left;
            if (nodeToDelete.left != 0x0) {
                child = _index.nodes[nodeToDelete.left];
                child.parent = replacementNode.id;
            }

            replacementNode.right = nodeToDelete.right;
            if (nodeToDelete.right != 0x0) {
                child = _index.nodes[nodeToDelete.right];
                child.parent = replacementNode.id;
            }

        } else if (nodeToDelete.parent != 0x0) {
            // The node being deleted is a leaf node so we only erase
            //  its parent linkage.
            parent = _index.nodes[nodeToDelete.parent];

            if (parent.left == nodeToDelete.id) {
                parent.left = 0x0;
            }
            if (parent.right == nodeToDelete.id) {
                parent.right = 0x0;
            }

            // Keep note of where the rebalancing should begin.
            rebalanceOrigin = parent.id;

        } else {
            // This is both a leaf node and the root node, so we need
            //  to unset the root node pointer.
            _index.root = 0x0;
        }

        // Now we zero out all of the fields on the nodeToDelete.
        delete nodeToDelete.id;
        delete nodeToDelete.value;
        delete nodeToDelete.parent;
        delete nodeToDelete.left;
        delete nodeToDelete.right;
        delete nodeToDelete.height;

        // Walk back up the tree rebalancing.
        if (rebalanceOrigin != 0x0) {
            _rebalanceTree(_index, rebalanceOrigin);
        }

        return true;
    }

    /**
     * @dev Checks whether a node for the given identifier exists
     *       within the given index.
     * @param _index The index which will be searched.
     * @param _id The unique identifier of the data element to check for.
     */
    function exists(Index storage _index, bytes32 _id)
        public constant returns (bool)
    {
        return _index.nodes[_id].height > 0;
    }

    function _rebalanceTree(Index storage _index, bytes32 _id)
        internal
    {
        // Trace back up rebalancing the tree and updating heights
        //  as needed...
        Node storage currentNode = _index.nodes[_id];

        while (true) {
            int balanceFactor = _getBalanceFactor(_index, currentNode.id);

            if (balanceFactor == 2) {
                // Right rotation (tree is heavy on the left)
                if (_getBalanceFactor(_index, currentNode.left) == -1) {
                    // The subtree is leaning right so it needs to be
                    //  rotated left before the current node is rotated
                    //  right.
                    _rotateLeft(_index, currentNode.left);
                }
                _rotateRight(_index, currentNode.id);
            }

            if (balanceFactor == -2) {
                // Left rotation (tree is heavy on the right)
                if (_getBalanceFactor(_index, currentNode.right) == 1) {
                    // The subree is leaning left so it needs to be 
                    //  rotated right before the current node is 
                    //  rotated to the left.
                    _rotateLeft(_index, currentNode.right);
                }
                _rotateLeft(_index, currentNode.id);
            }

            if ((-1 <= balanceFactor) && (balanceFactor <= 1)) {
                _updateNodeHeight(_index, currentNode.id);
            }

            if (currentNode.parent == 0x0) {
                // Reached the root which may be new due to tree
                //  rotation, so set it as the root and then break.
                break;
            }

            currentNode = _index.nodes[currentNode.parent];
        }
    }

    // TODO: heavy audit on whether the casting of integers is safe
    function _getBalanceFactor(Index storage _index, bytes32 _id)
        internal returns (int)
    {
        Node storage node = _index.nodes[_id];

        // Cast as signed integers so we can return negative numbers
        return int(index.nodes[node.left].height) - int(index.nodes[node.right].height);
    }

    function _updateNodeHeight(Index storage _index, bytes32 _id)
        internal returns (bool)
    {
        Node storage node = _index.nodes[_id];

        node.height = MathHelper.max(_index.nodes[node.left].height, _index.nodes[node.right].height) + 1;
        return true;
    }

    function _rotateLeft(Index storage _index, bytes32 _id)
        internal
    {
        Node storage originalRoot = _index.nodes[_id];

        // Cannot rotate left if there is no original root
        //  to rotate into place.
        require(originalRoot.right != 0x0);

        // The right child is the new root, so it gets the original
        //  `originalRoot.parent` as its parent.
        Node storage newRoot = _index.nodes[originalRoot.right];
        newRoot.parent = originalRoot.parent;

        // The original root needs to have its right child mulled out.
        orginalRoot.right = 0x0;

        if (originalRoot.parent != 0x0) {
            // If there's a parent node, it needs to now point downward
            //  at the new root which is rotating into the place where
            //  `node` was.
            Node storage parent = _index.nodes[originalRoot.parent];

            // Figure out if original root is a left or a right child
            //  and have the parent point to the new node.
            if (parent.left == originalRoot.id) {
                parent.left = newRoot.id;
            } else {
                parent.right = newRoot.id;
            }
        }

        if (newRoot.left != 0x0) {
            // If the new root had a left child, that moves to be the
            //  new right child of the original root node.
            Node storage leftChild = _index.nodes[newRoot.left];
            originalRoot.right = leftChild.id;
            leftChild.parent = orginalRoot.id;
        }

        // Update the new root's left node to point at the original node.
        originalRoot.parent = newRoot.id;
        newRoot.left = originalRoot.id;

        if (newRoot.parent == 0x0) {
            index.root = newRoot.id;
        }

        // TODO: Are both of these updates necessary?
        _updateNodeHeight(_index, originalRoot.id);
        _updateNodeHeight(_index, newRoot.id);
    }

    function _rotateRight(Index storage _index, bytes32 _id)
        internal
    {
        Node storage originalRoot = _index.nodes[_id];

        // Cannot rotate right if there is no left node to rotate
        //  into place.
        require(originalRoot.left != 0x0);

        // The left child is taking the place of node, so we update
        //  its parent to be the original parent node.
        Node storage newRoot = _index.nodes[originalRoot.left];
        newRoot.parent = originalRoot.parent;

        // Null out the originalRoot.left
        originalRoot.left = 0x0;

        if (originalRoot.parent != 0x0) {
            // If the node has a parent, update the correct child
            //  to point at the new root now.
            Node storage parent = _index.nodes[originalRoot.parent];

            if (parent.left == originalRoot.id) {
                parent.left = newRoot.id;
            } else {
                parent.right = newRoot.id;
            }

            if (newRoot.right != 0x0) {
                Node storage rightChild = _index.nodes[newRoot.right];
                originalRoot.left = newRoot.right;
                rightChild.parent = originalRoot.id;
            }

            // Update the new root's right noe to point to original node.
            originalRoot.parent = newRoot.id;
            newRoot.right = originalRoot.id;

            if (newRoot.parent == 0x0) {
                _index.root = newRoot.id;
            }

            // Recompute heights
            _updateNodeHeight(_index, originalRoot.id);
            _updateNodeHeight(_index, newRoot.id);
        }

    }

}