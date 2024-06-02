const express = require('express')
const app = express()
const path = require('path')

const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const dbpath = path.join(__dirname, 'todoApplication.db')

let database = null

app.use(express.json())

const initilizeDatabaseAndServer = async () => {
  try {
    database = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB ERROR : ${e.message}`)
    process.exit(1)
  }
}
initilizeDatabaseAndServer()

//get todo

const hasPriorityandstatusProperty = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasstatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let getTodoQueryResponse = null
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query
  switch (true) {
    case hasPriorityandstatusProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE 
        todo like '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}'
        ;`
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE 
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`
      break
    case hasstatusProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'
      AND status = '${status}';`
      break
    default:
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`
  }
  getTodoQueryResponse = await database.all(getTodosQuery)
  response.send(getTodoQueryResponse)
})

const createTodoArray = eachItem => {
  return {
    id: eachItem.id,
    todo: 'eachItem.todo',
    priority: 'eachItem.priority',
    status: 'eachItem.status',
  }
}

//get todoID
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`
  const getTodoQueryResponse = await database.get(getTodoQuery)
  console.log(getTodoQueryResponse)
  response.send(getTodoQueryResponse)
})

//post TODO

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const postTodoQuery = `
  INSERT INTO todo (id, todo, priority, status) VALUES 
  (${id},'${todo}','${priority}','${status}');
  `
  const postTodoQueryResponse = await database.run(postTodoQuery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updatedColumn = ''
  const requestBody = request.body

  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updatedColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updatedColumn = 'Todo'
      break
  }

  const previousTodoQuery = `
  SELECT * FROM todo WHERE id = ${todoId};`
  const previousTodoQueryResponse = await database.get(previousTodoQuery)

  const {
    todo = previousTodoQueryResponse.todo,
    priority = previousTodoQueryResponse.priority,
    status = previousTodoQueryResponse.status,
  } = request.body

  const updatedTodoQuery = `UPDATE todo SET 
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
    WHERE 
    id = ${todoId};`
  await database.run(updatedTodoQuery)
  response.send(`${updatedColumn} Updated`)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `DELETE  FROM todo WHERE id = ${todoId};`
  await database.run(deleteTodoQuery)
  response.send('Todo Deleted')
})
module.exports = app
