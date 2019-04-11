import { find } from "lodash/fp";
import React, { useCallback, useEffect, useState } from "react";
import { ButtonToolbar } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import { LinkContainer } from "react-router-bootstrap";
import { nullUser } from "../app-helper";
import User from "../interfaces/user";
import AWSService from "../services/aws-service";
import ConfirmationModal from "./ConfirmationModal";

export default function Settings() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User>(nullUser());
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const receivedUsers = await AWSService.retrieveUsers();
    setUsers(receivedUsers);
  };

  const handleDelete = useCallback(async () => {
    await AWSService.deleteUser(selectedUser.username);
    setShowDeleteModal(false);
    await fetchData();
  }, [selectedUser]);

  const handleOpenDeleteModal = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setShowDeleteModal(true);
      const target = event.target as HTMLElement;
      const user = find({ username: target.dataset.username })(users) as User;
      setSelectedUser(user);
    },
    [users],
  );

  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  const renderUsers = () =>
    users.map((user) => (
      <tr key={user.username}>
        <td>{user.username}</td>
        <td>{user.creationDate.toLocaleDateString("en-US")}</td>
        <td>{user.email}</td>
        <td>{user.fullName}</td>
        <td>{user.phoneNumber}</td>
        <td>{user.status}</td>
        <td>
          <Button
            variant="outline-danger"
            size="sm"
            data-username={user.username}
            onClick={handleOpenDeleteModal}
          >
            Delete
          </Button>
        </td>
      </tr>
    ));

  return (
    <section id="admin-users">
      <h1>Users</h1>
      <p>This section displays all the administrator users that have access to this backoffice.</p>
      <ButtonToolbar>
        <LinkContainer to="/users/create" exact={true}>
          <Button variant="outline-primary">Create New User</Button>
        </LinkContainer>
      </ButtonToolbar>
      <Table striped={true} hover={true} className="mt-3">
        <thead>
          <tr>
            <th>Username</th>
            <th>Creation Date</th>
            <th>Email</th>
            <th>Name</th>
            <th>Phone Number</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>{renderUsers()}</tbody>
      </Table>
      <ConfirmationModal
        title={`Are you sure you want to delete user '${selectedUser.username}'?`}
        show={showDeleteModal}
        onConfirm={handleDelete}
        onClose={handleCloseDeleteModal}
      />
    </section>
  );
}
