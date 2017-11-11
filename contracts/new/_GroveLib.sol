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
        public
    {
        if (_index.nodes[_id].id == _id) {
            // A node with this _id already exists. If the value is
            //  the same, then return early, otherwise, remove it
            //  and reinsert it.
            if (_index.nodes[_id].value == _value) {
                return;
            }
            remove(_index, _id);
            /// ...
        }
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
    }

    function exists() {}
}