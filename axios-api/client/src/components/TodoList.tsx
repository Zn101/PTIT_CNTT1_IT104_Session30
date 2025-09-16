import { useEffect, useState } from "react";
import axios from "axios";

type Task = {
  id: string;
  title: string;
  completed: boolean;
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [bulkDeleteType, setBulkDeleteType] = useState<"completed" | "all" | null>(null);
  const [newTask, setNewTask] = useState("");
  const [error, setError] = useState("");
  const [editError, setEditError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const [filter, setFilter] = useState<"all" | "completed" | "active">("all");
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.log("Error: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      if (bulkDeleteType === "completed") {
        const completedTasks = tasks.filter((t) => t.completed);
        await Promise.all(completedTasks.map((t) => axios.delete(`http://localhost:3000/tasks/${t.id}`)));
        setTasks(tasks.filter((t) => !t.completed));
      } else if (bulkDeleteType === "all") {
        await Promise.all(tasks.map((t) => axios.delete(`http://localhost:3000/tasks/${t.id}`)));
        setTasks([]);
      } else if (taskToDelete) {
        await axios.delete(`http://localhost:3000/tasks/${taskToDelete.id}`);
        setTasks(tasks.filter((t) => t.id !== taskToDelete.id));
      }
      setShowDeleteModal(false);
      setTaskToDelete(null);
      setBulkDeleteType(null);
    } catch (error) {
      console.log("Delete failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) {
      setError("Tên công việc không được để trống!");
      return;
    }

    if (tasks.some((t) => t.title.toLowerCase() === newTask.trim().toLowerCase())) {
      setError("Công việc này đã tồn tại!");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`http://localhost:3000/tasks`, {
        title: newTask.trim(),
        completed: false,
      });
      setTasks([...tasks, response.data]);
      setNewTask("");
      setError("");
    } catch (error) {
      console.log("Add task failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = async (task: Task) => {
    try {
      setLoading(true);
      const updatedTask = { ...task, completed: !task.completed };
      await axios.put(`http://localhost:3000/tasks/${task.id}`, updatedTask);

      const newTasks = tasks.map((t) => (t.id === task.id ? updatedTask : t));
      setTasks(newTasks);

      if (newTasks.length > 0 && newTasks.every((t) => t.completed)) {
        setShowCompleteModal(true);
      }
    } catch (error) {
      console.log("Toggle task failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (task: Task) => {
    setTaskToEdit(task);
    setEditTitle(task.title);
    setShowEditModal(true);
  };

  const confirmEdit = async () => {
    if (!taskToEdit) return;

    if (!editTitle.trim()) {
      setEditError("Tên công việc không được để trống!");
      return;
    }

    if (
      tasks.some(
        (t) =>
          t.title.toLowerCase() === editTitle.trim().toLowerCase() &&
          t.id !== taskToEdit.id
      )
    ) {
      setEditError("Công việc này đã tồn tại!");
      return;
    }

    try {
      setLoading(true);
      const updatedTask = { ...taskToEdit, title: editTitle.trim() };
      await axios.put(`http://localhost:3000/tasks/${taskToEdit.id}`, updatedTask);
      setTasks(tasks.map((t) => (t.id === taskToEdit.id ? updatedTask : t)));
      setShowEditModal(false);
      setTaskToEdit(null);
    } catch (error) {
      console.log("Edit failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.completed;
    if (filter === "active") return !task.completed;
    return true;
  });

  return (
    <div className="container py-5">
      {loading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}
        >
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-body">
          <h3 className="text-center mb-4">Quản lý công việc</h3>

          <div className="mb-3 shadow-sm p-3 rounded">
            <input
              type="text"
              className={`form-control ${error ? "is-invalid" : ""}`}
              placeholder="Nhập tên công việc"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
            {error && <small className="text-danger d-block mt-1">{error}</small>}
            <button className="btn btn-primary mt-3 w-100" onClick={addTask}>
              Thêm công việc
            </button>
          </div>

          <div className="d-flex justify-content-center mb-3 p-3 shadow-sm rounded">
            <div className="d-flex gap-2">
              <button
                className={`btn ${filter === "all" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setFilter("all")}
              >
                Tất cả
              </button>
              <button
                className={`btn ${filter === "completed" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setFilter("completed")}
              >
                Hoàn thành
              </button>
              <button
                className={`btn ${filter === "active" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setFilter("active")}
              >
                Đang thực hiện
              </button>
            </div>
          </div>

          <ul
            className="list-group mb-3 p-3 shadow-sm rounded"
            style={{ maxHeight: "300px", overflowY: "auto" }}
          >
            {filteredTasks.map((task) => (
              <li
                key={task.id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <div>
                  <input
                    className="form-check-input me-2"
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleTaskToggle(task)}
                  />
                  {task.completed ? <s>{task.title}</s> : task.title}
                </div>
                <div>
                  <button
                    className="btn btn-sm me-1"
                    onClick={() => handleEditClick(task)}
                  >
                    ✏️
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => handleDeleteClick(task)}
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="d-flex justify-content-between gap-2">
            <button
              className="btn btn-danger"
              onClick={() => {
                setBulkDeleteType("completed");
                setShowDeleteModal(true);
              }}
            >
              Xóa công việc hoàn thành
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                setBulkDeleteType("all");
                setShowDeleteModal(true);
              }}
            >
              Xóa tất cả công việc
            </button>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Xác nhận xóa</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setTaskToDelete(null);
                    setBulkDeleteType(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {bulkDeleteType === "completed" && (
                  <>Bạn có chắc muốn <strong>xóa tất cả công việc đã hoàn thành</strong>?</>
                )}
                {bulkDeleteType === "all" && (
                  <>Bạn có chắc muốn <strong>xóa tất cả công việc</strong>?</>
                )}
                {!bulkDeleteType && taskToDelete && (
                  <>Bạn có chắc muốn xóa công việc <strong>{taskToDelete.title}</strong>?</>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setTaskToDelete(null);
                    setBulkDeleteType(null);
                  }}
                >
                  Hủy
                </button>
                <button className="btn btn-danger" onClick={confirmDelete}>
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Chỉnh sửa công việc</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditError("");
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  className={`form-control ${editError ? "is-invalid" : ""}`}
                  value={editTitle}
                  onChange={(e) => {
                    setEditTitle(e.target.value);
                    setEditError("");
                  }}
                />
                {editError && (
                  <small className="text-danger d-block mt-1">{editError}</small>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditError("");
                  }}
                >
                  Hủy
                </button>
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    if (!editTitle.trim()) {
                      setEditError("Tên công việc không được để trống!");
                      return;
                    }
                    await confirmEdit();
                    setEditError("");
                  }}
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCompleteModal && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <p className="mb-0">Hoàn thành công việc</p>
              </div>
              <div className="modal-footer justify-content-center">
                <button
                  className="btn btn-success"
                  onClick={() => setShowCompleteModal(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
