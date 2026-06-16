import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"

function App() {
  const [tasks, setTasks] = useState([])
  const [weeklyData, setWeeklyData] = useState([])
  const [taskTypeData, setTaskTypeData] = useState([])
  const [aiSuggestion, setAiSuggestion] = useState(null)

  const [summary, setSummary] = useState({
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    completion_rate: 0
  })

  const [productivity, setProductivity] = useState({
    completion_rate: 0,
    completed_tasks: 0,
    postponed_tasks: 0,
    overdue_tasks: 0,
    most_active_category: "無資料"
  })

  const [completionTime, setCompletionTime] = useState({
    average_days: 0,
    fastest_days: 0,
    slowest_days: 0
  })

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("學習")
  const [categories, setCategories] = useState(["學習", "求職", "健康", "專案", "生活"])
  const [deadline, setDeadline] = useState("")
  const [importance, setImportance] = useState(3)
  const [estimatedHours, setEstimatedHours] = useState(0)
  const [estimatedMinutes, setEstimatedMinutes] = useState(30)

  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [editingCategoryIndex, setEditingCategoryIndex] = useState(null)
  const [editingCategoryName, setEditingCategoryName] = useState("")

  const [editingTask, setEditingTask] = useState(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editCategory, setEditCategory] = useState("學習")
  const [editDeadline, setEditDeadline] = useState("")
  const [editImportance, setEditImportance] = useState(3)
  const [editEstimatedHours, setEditEstimatedHours] = useState(0)
  const [editEstimatedMinutes, setEditEstimatedMinutes] = useState(30)

  const pieColors = ["#38BDF8", "#22C55E", "#FACC15", "#A78BFA", "#FB7185", "#F97316"]

  const fetchTasks = () => {
    fetch("http://127.0.0.1:5000/api/tasks")
      .then((response) => response.json())
      .then((result) => setTasks(result.data))
      .catch((error) => console.error("取得任務失敗:", error))
  }

  const fetchSummary = () => {
    fetch("http://127.0.0.1:5000/api/analytics/summary")
      .then((response) => response.json())
      .then((result) => setSummary(result.data))
      .catch((error) => console.error("取得統計資料失敗:", error))
  }

  const fetchProductivity = () => {
    fetch("http://127.0.0.1:5000/api/analytics/productivity")
      .then((response) => response.json())
      .then((result) => setProductivity(result.data))
      .catch((error) => console.error("取得生產力分析失敗:", error))
  }

  const fetchCompletionTime = () => {
    fetch("http://127.0.0.1:5000/api/analytics/completion-time")
      .then((response) => response.json())
      .then((result) => setCompletionTime(result.data))
      .catch((error) => console.error("取得完成時間分析失敗:", error))
  }

  const fetchWeeklyData = () => {
    fetch("http://127.0.0.1:5000/api/analytics/weekly")
      .then((response) => response.json())
      .then((result) => setWeeklyData(result.data))
      .catch((error) => console.error("取得本週資料失敗:", error))
  }

  const fetchTaskTypeData = () => {
    fetch("http://127.0.0.1:5000/api/analytics/task-types")
      .then((response) => response.json())
      .then((result) => setTaskTypeData(result.data))
      .catch((error) => console.error("取得分類統計失敗:", error))
  }

  const fetchAISuggestion = () => {
    fetch("http://127.0.0.1:5000/api/ai/suggest", {
      method: "POST"
    })
      .then((response) => response.json())
      .then((result) => setAiSuggestion(result.data))
      .catch((error) => console.error("取得 AI 建議失敗:", error))
  }

  const refreshData = () => {
    fetchTasks()
    fetchSummary()
    fetchProductivity()
    fetchCompletionTime()
    fetchWeeklyData()
    fetchTaskTypeData()
    setAiSuggestion(null)
  }

  useEffect(() => {
    refreshData()
  }, [])

  const handleAddTask = (event) => {
    event.preventDefault()

    const totalEstimatedMinutes =
      Number(estimatedHours) * 60 + Number(estimatedMinutes)

    fetch("http://127.0.0.1:5000/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        description,
        category,
        deadline,
        importance: Number(importance),
        estimated_minutes: totalEstimatedMinutes
      })
    })
      .then((response) => response.json())
      .then(() => {
        setTitle("")
        setDescription("")
        setCategory("學習")
        setDeadline("")
        setImportance(3)
        setEstimatedHours(0)
        setEstimatedMinutes(30)
        refreshData()
      })
      .catch((error) => console.error("新增任務失敗:", error))
  }

  const handleCompleteTask = (task) => {
    fetch(`http://127.0.0.1:5000/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        category: task.category,
        deadline: task.deadline,
        importance: Number(task.importance),
        estimated_minutes: Number(task.estimated_minutes),
        postpone_count: Number(task.postpone_count || 0),
        status: "completed"
      })
    })
      .then((response) => response.json())
      .then(() => refreshData())
      .catch((error) => console.error("完成任務失敗:", error))
  }

  const handlePostponeTask = (taskId) => {
    fetch(`http://127.0.0.1:5000/api/tasks/${taskId}/postpone`, {
      method: "PUT"
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.status === "error") {
          alert(result.message)
          return
        }

        refreshData()
      })
      .catch((error) => console.error("延後任務失敗:", error))
  }

  const handleDeleteTask = (taskId) => {
    fetch(`http://127.0.0.1:5000/api/tasks/${taskId}`, {
      method: "DELETE"
    })
      .then((response) => response.json())
      .then(() => refreshData())
      .catch((error) => console.error("刪除任務失敗:", error))
  }

  const openEditTaskModal = (task) => {
    setEditingTask(task)
    setEditTitle(task.title)
    setEditDescription(task.description)
    setEditCategory(task.category)
    setEditDeadline(task.deadline)
    setEditImportance(task.importance)
    setEditEstimatedHours(Math.floor(task.estimated_minutes / 60))
    setEditEstimatedMinutes(task.estimated_minutes % 60)
  }

  const handleUpdateTask = () => {
    const totalEstimatedMinutes =
      Number(editEstimatedHours) * 60 + Number(editEstimatedMinutes)

    fetch(`http://127.0.0.1:5000/api/tasks/${editingTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        description: editDescription,
        category: editCategory,
        deadline: editDeadline,
        importance: Number(editImportance),
        estimated_minutes: totalEstimatedMinutes,
        postpone_count: Number(editingTask.postpone_count || 0),
        status: editingTask.status
      })
    })
      .then((response) => response.json())
      .then(() => {
        setEditingTask(null)
        refreshData()
      })
      .catch((error) => console.error("編輯任務失敗:", error))
  }

  const handleAddCategory = () => {
    const cleanName = newCategoryName.trim()
    if (cleanName === "") return

    if (!categories.includes(cleanName)) {
      setCategories([...categories, cleanName])
    }

    setCategory(cleanName)
    setNewCategoryName("")
  }

  const handleStartEditCategory = (index, name) => {
    setEditingCategoryIndex(index)
    setEditingCategoryName(name)
  }

  const handleSaveEditCategory = () => {
    const cleanName = editingCategoryName.trim()
    if (cleanName === "") return

    const oldName = categories[editingCategoryIndex]
    const updatedCategories = [...categories]
    updatedCategories[editingCategoryIndex] = cleanName

    setCategories(updatedCategories)

    if (category === oldName) setCategory(cleanName)
    if (editCategory === oldName) setEditCategory(cleanName)

    setEditingCategoryIndex(null)
    setEditingCategoryName("")
  }

  const handleDeleteCategory = (name) => {
    if (categories.length === 1) return

    const updatedCategories = categories.filter((item) => item !== name)
    setCategories(updatedCategories)

    if (category === name) setCategory(updatedCategories[0])
    if (editCategory === name) setEditCategory(updatedCategories[0])
  }

  const pendingTasks = tasks.filter((task) => task.status !== "completed")

  const importantTasks = [...pendingTasks]
    .sort((a, b) => {
      if (Number(b.postpone_count || 0) !== Number(a.postpone_count || 0)) {
        return Number(b.postpone_count || 0) - Number(a.postpone_count || 0)
      }

      if (Number(b.importance) !== Number(a.importance)) {
        return Number(b.importance) - Number(a.importance)
      }

      if (!a.deadline) return 1
      if (!b.deadline) return -1

      return new Date(a.deadline) - new Date(b.deadline)
    })
    .slice(0, 3)

  const upcomingTasks = [...pendingTasks]
    .filter((task) => task.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3)

  const pageStyle = {
    minHeight: "100vh",
    backgroundColor: "#0F172A",
    color: "#E5E7EB",
    padding: "32px"
  }

  const containerStyle = {
    maxWidth: "1200px",
    margin: "0 auto"
  }

  const cardStyle = {
    backgroundColor: "#1E293B",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "22px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)"
  }

  const inputStyle = {
    flex: 1,
    padding: "10px 12px",
    fontSize: "15px",
    backgroundColor: "#0F172A",
    color: "#F8FAFC",
    border: "1px solid #334155",
    borderRadius: "8px",
    outline: "none"
  }

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  }

  const labelStyle = {
    width: "90px",
    textAlign: "right",
    fontWeight: "bold",
    color: "#CBD5E1"
  }

  const sectionTitleStyle = {
    color: "#F8FAFC",
    marginBottom: "16px",
    textAlign: "center"
  }

  const summaryCardStyle = {
    ...cardStyle,
    textAlign: "center",
    flex: 1
  }

  const summaryNumberStyle = {
    fontSize: "34px",
    fontWeight: "bold",
    margin: "10px 0 0",
    color: "#38BDF8"
  }

  const primaryButtonStyle = {
    backgroundColor: "#38BDF8",
    color: "#0F172A",
    border: "none",
    borderRadius: "10px",
    padding: "12px",
    fontWeight: "bold",
    cursor: "pointer"
  }

  const secondaryButtonStyle = {
    backgroundColor: "#334155",
    color: "#F8FAFC",
    border: "1px solid #475569",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "bold",
    cursor: "pointer"
  }

  const postponeButtonStyle = {
    backgroundColor: "#F97316",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    padding: "6px 12px",
    cursor: "pointer",
    fontWeight: "bold"
  }

  const usedPostponeStyle = {
    backgroundColor: "#334155",
    color: "#CBD5E1",
    border: "1px solid #475569",
    borderRadius: "8px",
    padding: "6px 12px",
    fontWeight: "bold"
  }

  const iconButtonStyle = {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "22px",
    fontWeight: "bold"
  }

  const starButtonStyle = {
    background: "transparent",
    border: "none",
    fontSize: "28px",
    cursor: "pointer",
    padding: "0 3px",
    color: "#FACC15"
  }

  const productivityCardStyle = {
    backgroundColor: "#0F172A",
    border: "1px solid #334155",
    borderRadius: "14px",
    padding: "18px",
    textAlign: "center"
  }

  const productivityNumberStyle = {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#38BDF8",
    marginTop: "8px"
  }

  const modalBackdropStyle = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  }

  const modalStyle = {
    backgroundColor: "#1E293B",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "24px",
    width: "520px",
    maxWidth: "90vw",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)"
  }

  const getStatusText = (status) => {
    return status === "completed" ? "已完成" : "未完成"
  }

  const getStatusStyle = (status) => {
    return {
      color: status === "completed" ? "#22C55E" : "#FACC15",
      fontWeight: "bold"
    }
  }

  const getPostponeText = (task) => {
    return Number(task.postpone_count || 0) >= 1 ? "已使用延後" : "尚未延後"
  }

  const getPostponeTextColor = (task) => {
    return Number(task.postpone_count || 0) >= 1 ? "#F97316" : "#94A3B8"
  }

  const renderStars = (value, setter) => {
    return [1, 2, 3, 4, 5].map((starNumber) => (
      <button
        key={starNumber}
        type="button"
        style={starButtonStyle}
        onClick={() => setter(starNumber)}
      >
        {starNumber <= value ? "★" : "☆"}
      </button>
    ))
  }

  const renderTaskInfoCard = (task) => {
    return (
      <div
        key={task.id}
        style={{
          backgroundColor: "#0F172A",
          border: "1px solid #334155",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "12px"
        }}
      >
        <h3 style={{ margin: "0 0 10px", color: "#F8FAFC" }}>
          {task.title}
        </h3>

        <p>任務描述：{task.description || "未填寫"}</p>
        <p>任務分類：{task.category || "未分類"}</p>
        <p>截止日期：{task.deadline || "未設定"}</p>

        <p>
          重要性：
          <span style={{ color: "#FACC15", marginLeft: "6px" }}>
            {"★".repeat(task.importance)}
            {"☆".repeat(5 - task.importance)}
          </span>
        </p>

        <p>
          預估時間：
          {Math.floor(task.estimated_minutes / 60)} 時{" "}
          {task.estimated_minutes % 60} 分
        </p>

        <p>
          延後狀態：
          <span
            style={{
              color: getPostponeTextColor(task),
              fontWeight: "bold",
              marginLeft: "6px"
            }}
          >
            {getPostponeText(task)}
          </span>
        </p>

        <p>
          狀態：
          <span style={getStatusStyle(task.status)}>
            {getStatusText(task.status)}
          </span>
        </p>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <header
          style={{
            marginBottom: "24px",
            textAlign: "center",
            position: "relative"
          }}
        >
          <h1 style={{ fontSize: "36px", margin: 0, color: "#F8FAFC" }}>
            AI 生產力分析儀表板
          </h1>

          <button
            type="button"
            onClick={refreshData}
            style={{
              ...secondaryButtonStyle,
              position: "absolute",
              top: "8px",
              right: "0",
              padding: "7px 10px",
              fontSize: "13px",
              borderRadius: "8px"
            }}
          >
            重新整理
          </button>

          <p style={{ marginTop: "8px", color: "#94A3B8" }}>
            任務管理 × 完成紀錄 × 生產力分析 × AI 建議
          </p>
        </header>

        <section
          style={{
            ...cardStyle,
            marginBottom: "34px",
            textAlign: "center"
          }}
        >
          <h2 style={{ margin: 0, color: "#F8FAFC" }}>AI 任務建議</h2>
          <p style={{ margin: "10px 0 18px", color: "#94A3B8" }}>
            根據重要性、截止日期、預估時間與延後狀態，產生今日優先任務建議
          </p>

          <button type="button" onClick={fetchAISuggestion} style={primaryButtonStyle}>
            今天我該先做什麼？
          </button>

          {aiSuggestion === null ? (
            <div
              style={{
                backgroundColor: "#0F172A",
                border: "1px solid #334155",
                borderRadius: "12px",
                padding: "22px",
                color: "#94A3B8",
                marginTop: "22px"
              }}
            >
              點擊上方按鈕，讓系統根據目前任務產生建議。
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "#0F172A",
                border: "1px solid #334155",
                borderRadius: "12px",
                padding: "22px",
                marginTop: "22px"
              }}
            >
              <h3 style={{ marginTop: 0, color: "#38BDF8" }}>
                {aiSuggestion.suggestion}
              </h3>

              {aiSuggestion.task && (
                <p style={{ color: "#CBD5E1" }}>
                  任務分類：{aiSuggestion.category || "未分類"} ｜ 截止日期：
                  {aiSuggestion.deadline || "未設定"} ｜ 重要性：
                  <span style={{ color: "#FACC15", marginLeft: "4px" }}>
                    {"★".repeat(aiSuggestion.importance)}
                  </span>
                  ｜ 延後狀態：
                  <span style={{ color: "#F97316", marginLeft: "4px", fontWeight: "bold" }}>
                    {Number(aiSuggestion.postpone_count || 0) >= 1 ? "已使用延後" : "尚未延後"}
                  </span>
                </p>
              )}

              <div style={{ marginTop: "14px" }}>
                <strong style={{ color: "#F8FAFC" }}>建議原因：</strong>
                <ul
                  style={{
                    color: "#CBD5E1",
                    lineHeight: 1.9,
                    display: "inline-block",
                    textAlign: "left"
                  }}
                >
                  {aiSuggestion.reason.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        <section
          style={{
            ...cardStyle,
            marginBottom: "34px"
          }}
        >
          <h2 style={{ marginTop: 0, textAlign: "center", color: "#F8FAFC" }}>
            生產力分析
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "16px"
            }}
          >
            <div style={productivityCardStyle}>
              <div style={{ color: "#94A3B8" }}>完成率</div>
              <div style={productivityNumberStyle}>{productivity.completion_rate}%</div>
            </div>

            <div style={productivityCardStyle}>
              <div style={{ color: "#94A3B8" }}>已完成任務</div>
              <div style={productivityNumberStyle}>{productivity.completed_tasks}</div>
            </div>

            <div style={productivityCardStyle}>
              <div style={{ color: "#94A3B8" }}>已延後任務</div>
              <div style={productivityNumberStyle}>{productivity.postponed_tasks}</div>
            </div>

            <div style={productivityCardStyle}>
              <div style={{ color: "#94A3B8" }}>逾期任務</div>
              <div style={productivityNumberStyle}>{productivity.overdue_tasks}</div>
            </div>

            <div style={productivityCardStyle}>
              <div style={{ color: "#94A3B8" }}>最常完成分類</div>
              <div style={{ ...productivityNumberStyle, fontSize: "24px" }}>
                {productivity.most_active_category}
              </div>
            </div>
          </div>

          <h3
            style={{
              marginTop: "28px",
              marginBottom: "16px",
              textAlign: "center",
              color: "#F8FAFC"
            }}
          >
            任務完成效率
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px"
            }}
          >
            <div style={productivityCardStyle}>
              <div style={{ color: "#94A3B8" }}>平均完成時間</div>
              <div style={productivityNumberStyle}>{completionTime.average_days}</div>
              <div style={{ color: "#94A3B8", marginTop: "4px" }}>天</div>
            </div>

            <div style={productivityCardStyle}>
              <div style={{ color: "#94A3B8" }}>最快完成</div>
              <div style={productivityNumberStyle}>{completionTime.fastest_days}</div>
              <div style={{ color: "#94A3B8", marginTop: "4px" }}>天</div>
            </div>

            <div style={productivityCardStyle}>
              <div style={{ color: "#94A3B8" }}>最慢完成</div>
              <div style={productivityNumberStyle}>{completionTime.slowest_days}</div>
              <div style={{ color: "#94A3B8", marginTop: "4px" }}>天</div>
            </div>
          </div>
        </section>

        <section style={{ ...cardStyle, marginBottom: "34px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px"
            }}
          >
            <div>
              <h2 style={{ color: "#F8FAFC", marginTop: 0, textAlign: "center" }}>
                最重要任務排序：
              </h2>

              {importantTasks.length === 0 ? (
                <div style={{ color: "#94A3B8", textAlign: "center", padding: "24px 0" }}>
                  目前沒有未完成任務
                </div>
              ) : (
                importantTasks.map((task) => renderTaskInfoCard(task))
              )}
            </div>

            <div>
              <h2 style={{ color: "#F8FAFC", marginTop: 0, textAlign: "center" }}>
                即將到期任務：
              </h2>

              {upcomingTasks.length === 0 ? (
                <div style={{ color: "#94A3B8", textAlign: "center", padding: "24px 0" }}>
                  目前沒有設定截止日期的任務
                </div>
              ) : (
                upcomingTasks.map((task) => renderTaskInfoCard(task))
              )}
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "34px" }}>
          <h2 style={sectionTitleStyle}>新增任務</h2>

          <form
            onSubmit={handleAddTask}
            style={{
              ...cardStyle,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px 22px"
            }}
          >
            <div style={rowStyle}>
              <label style={labelStyle}>任務名稱</label>
              <input
                style={inputStyle}
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>

            <div style={rowStyle}>
              <label style={labelStyle}>任務描述</label>
              <input
                style={inputStyle}
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div style={rowStyle}>
              <label style={labelStyle}>任務分類</label>
              <select
                style={inputStyle}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                style={{
                  ...primaryButtonStyle,
                  padding: "9px 13px",
                  borderRadius: "8px"
                }}
              >
                +
              </button>
            </div>

            <div style={rowStyle}>
              <label style={labelStyle}>截止日期</label>
              <input
                style={inputStyle}
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
              />
            </div>

            <div style={rowStyle}>
              <label style={labelStyle}>重要性</label>
              <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                {renderStars(importance, setImportance)}
                <span style={{ marginLeft: "10px", color: "#CBD5E1" }}>
                  {importance} / 5
                </span>
              </div>
            </div>

            <div style={rowStyle}>
              <label style={labelStyle}>預估時間</label>

              <div
                style={{
                  flex: 1,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px"
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 36px",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <input
                    style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                    type="number"
                    min="0"
                    value={estimatedHours}
                    onChange={(event) => setEstimatedHours(event.target.value)}
                  />
                  <span>時</span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 36px",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <input
                    style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                    type="number"
                    min="0"
                    max="59"
                    value={estimatedMinutes}
                    onChange={(event) => setEstimatedMinutes(event.target.value)}
                  />
                  <span>分</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              style={{
                ...primaryButtonStyle,
                gridColumn: "1 / 3"
              }}
            >
              新增任務
            </button>
          </form>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "24px",
            marginBottom: "34px"
          }}
        >
          <div style={{ ...cardStyle, minHeight: "320px" }}>
            <h3 style={{ marginTop: 0, color: "#F8FAFC", textAlign: "center" }}>
              本週完成任務趨勢
            </h3>

            {weeklyData.length === 0 ? (
              <div style={{ color: "#94A3B8", textAlign: "center", padding: "90px 0" }}>
                目前沒有已完成任務資料
              </div>
            ) : (
              <div style={{ width: "100%", height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      stroke="#94A3B8"
                      tick={{ fill: "#94A3B8" }}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      tick={{ fill: "#94A3B8" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        border: "1px solid #334155",
                        color: "#F8FAFC"
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed_tasks"
                      name="完成任務數"
                      stroke="#38BDF8"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div style={{ ...cardStyle, minHeight: "320px" }}>
            <h3 style={{ marginTop: 0, color: "#F8FAFC", textAlign: "center" }}>
              任務分類圓餅圖
            </h3>

            {taskTypeData.length === 0 ? (
              <div style={{ color: "#94A3B8", textAlign: "center", padding: "90px 0" }}>
                目前沒有分類統計資料
              </div>
            ) : (
              <div style={{ width: "100%", height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskTypeData}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                      label
                    >
                      {taskTypeData.map((entry, index) => (
                        <Cell
                          key={entry.category}
                          fill={pieColors[index % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        border: "1px solid #334155",
                        color: "#F8FAFC"
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 style={sectionTitleStyle}>任務總覽</h2>

          {tasks.length === 0 ? (
            <div
              style={{
                ...cardStyle,
                textAlign: "center",
                padding: "42px 22px",
                color: "#CBD5E1"
              }}
            >
              <h3 style={{ marginTop: 0, color: "#F8FAFC" }}>
                開始建立你的第一個任務
              </h3>
              <p style={{ color: "#94A3B8", lineHeight: 1.8 }}>
                新增任務後，系統會自動更新完成率、分類分布與折線圖。
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "18px"
              }}
            >
              {tasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    ...cardStyle,
                    padding: "62px 22px 22px",
                    position: "relative"
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "14px",
                      left: "14px",
                      display: "flex",
                      gap: "10px"
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      style={{
                        ...iconButtonStyle,
                        color: "#EF4444"
                      }}
                    >
                      ✕
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditTaskModal(task)}
                      style={{
                        ...iconButtonStyle,
                        color: "#FACC15"
                      }}
                    >
                      ✎
                    </button>

                    {task.status !== "completed" &&
                      Number(task.postpone_count || 0) < 1 &&
                      task.deadline && (
                        <button
                          type="button"
                          onClick={() => handlePostponeTask(task.id)}
                          style={postponeButtonStyle}
                        >
                          延後
                        </button>
                      )}

                    {task.status !== "completed" &&
                      Number(task.postpone_count || 0) >= 1 && (
                        <div style={usedPostponeStyle}>
                          已延後
                        </div>
                      )}
                  </div>

                  {task.status !== "completed" ? (
                    <button
                      type="button"
                      onClick={() => handleCompleteTask(task)}
                      style={{
                        position: "absolute",
                        top: "14px",
                        right: "14px",
                        backgroundColor: "#22C55E",
                        color: "white",
                        border: "2px solid white",
                        borderRadius: "8px",
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontWeight: "bold"
                      }}
                    >
                      ✓ 完成任務
                    </button>
                  ) : (
                    <div
                      style={{
                        position: "absolute",
                        top: "14px",
                        right: "14px",
                        backgroundColor: "#22C55E",
                        color: "white",
                        border: "2px solid white",
                        borderRadius: "8px",
                        padding: "6px 12px",
                        fontWeight: "bold"
                      }}
                    >
                      ✓ 已完成
                    </div>
                  )}

                  <h3 style={{ textAlign: "center", marginTop: 0, color: "#F8FAFC" }}>
                    {task.title}
                  </h3>

                  <p>任務描述：{task.description || "未填寫"}</p>
                  <p>任務分類：{task.category || "未分類"}</p>
                  <p>截止日期：{task.deadline || "未設定"}</p>

                  <p>
                    重要性：
                    <span style={{ color: "#FACC15", fontSize: "20px", marginLeft: "5px" }}>
                      {"★".repeat(task.importance)}
                      {"☆".repeat(5 - task.importance)}
                    </span>
                  </p>

                  <p>
                    預估時間：
                    {Math.floor(task.estimated_minutes / 60)} 時{" "}
                    {task.estimated_minutes % 60} 分
                  </p>

                  <p>
                    延後狀態：
                    <span
                      style={{
                        color: getPostponeTextColor(task),
                        fontWeight: "bold",
                        marginLeft: "6px"
                      }}
                    >
                      {getPostponeText(task)}
                    </span>
                  </p>

                  <p>
                    狀態：
                    <span style={getStatusStyle(task.status)}>
                      {getStatusText(task.status)}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={{ marginTop: "34px" }}>
          <h2 style={sectionTitleStyle}>任務紀錄表</h2>

          <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
            <div style={summaryCardStyle}>
              <div style={{ color: "#94A3B8", fontSize: "14px" }}>總任務數</div>
              <div style={summaryNumberStyle}>{summary.total_tasks}</div>
            </div>

            <div style={summaryCardStyle}>
              <div style={{ color: "#94A3B8", fontSize: "14px" }}>已完成</div>
              <div style={summaryNumberStyle}>{summary.completed_tasks}</div>
            </div>

            <div style={summaryCardStyle}>
              <div style={{ color: "#94A3B8", fontSize: "14px" }}>未完成</div>
              <div style={summaryNumberStyle}>{summary.pending_tasks}</div>
            </div>

            <div style={summaryCardStyle}>
              <div style={{ color: "#94A3B8", fontSize: "14px" }}>完成率</div>
              <div style={summaryNumberStyle}>{summary.completion_rate}%</div>
            </div>
          </div>
        </section>

        {showCategoryModal && (
          <div style={modalBackdropStyle}>
            <div style={modalStyle}>
              <h2 style={{ marginTop: 0 }}>分類管理</h2>

              <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
                <input
                  style={inputStyle}
                  type="text"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                />
                <button type="button" onClick={handleAddCategory} style={primaryButtonStyle}>
                  新增分類
                </button>
              </div>

              {categories.map((item, index) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 0",
                    borderBottom: "1px solid #334155"
                  }}
                >
                  {editingCategoryIndex === index ? (
                    <>
                      <input
                        style={inputStyle}
                        type="text"
                        value={editingCategoryName}
                        onChange={(event) => setEditingCategoryName(event.target.value)}
                      />
                      <button type="button" onClick={handleSaveEditCategory}>
                        儲存
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ flex: 1 }}>{item}</div>
                      <button
                        type="button"
                        onClick={() => handleStartEditCategory(index, item)}
                        style={{ ...iconButtonStyle, color: "#FACC15" }}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(item)}
                        style={{ ...iconButtonStyle, color: "#EF4444" }}
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                style={{
                  ...primaryButtonStyle,
                  marginTop: "20px",
                  width: "100%"
                }}
              >
                關閉
              </button>
            </div>
          </div>
        )}

        {editingTask && (
          <div style={modalBackdropStyle}>
            <div style={modalStyle}>
              <h2 style={{ marginTop: 0 }}>編輯任務</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={rowStyle}>
                  <label style={labelStyle}>任務名稱</label>
                  <input
                    style={inputStyle}
                    type="text"
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                  />
                </div>

                <div style={rowStyle}>
                  <label style={labelStyle}>任務描述</label>
                  <input
                    style={inputStyle}
                    type="text"
                    value={editDescription}
                    onChange={(event) => setEditDescription(event.target.value)}
                  />
                </div>

                <div style={rowStyle}>
                  <label style={labelStyle}>任務分類</label>
                  <select
                    style={inputStyle}
                    value={editCategory}
                    onChange={(event) => setEditCategory(event.target.value)}
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={rowStyle}>
                  <label style={labelStyle}>截止日期</label>
                  <input
                    style={inputStyle}
                    type="date"
                    value={editDeadline}
                    onChange={(event) => setEditDeadline(event.target.value)}
                  />
                </div>

                <div style={rowStyle}>
                  <label style={labelStyle}>重要性</label>
                  <div style={{ flex: 1 }}>
                    {renderStars(editImportance, setEditImportance)}
                  </div>
                </div>

                <div style={rowStyle}>
                  <label style={labelStyle}>預估時間</label>
                  <input
                    style={inputStyle}
                    type="number"
                    min="0"
                    value={editEstimatedHours}
                    onChange={(event) => setEditEstimatedHours(event.target.value)}
                  />
                  <span>時</span>
                  <input
                    style={inputStyle}
                    type="number"
                    min="0"
                    max="59"
                    value={editEstimatedMinutes}
                    onChange={(event) => setEditEstimatedMinutes(event.target.value)}
                  />
                  <span>分</span>
                </div>

                <button type="button" onClick={handleUpdateTask} style={primaryButtonStyle}>
                  儲存修改
                </button>

                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  style={{
                    ...primaryButtonStyle,
                    backgroundColor: "#334155",
                    color: "#F8FAFC"
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App