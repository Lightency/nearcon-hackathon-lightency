import React, { useState, useEffect } from 'react'
import styled from 'styled-components'

// Formik
import { useFormik } from 'formik'
import * as Yup from 'yup'

//React Icons
import { FaHotjar } from 'react-icons/fa'
import { RiTempColdLine } from 'react-icons/ri'

//Primreact
import { FilterMatchMode, FilterOperator } from 'primereact/api'
import { Chart } from 'primereact/chart'
import { InputText } from 'primereact/inputtext'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Toolbar } from 'primereact/toolbar'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { classNames } from 'primereact/utils'
import { SelectButton } from 'primereact/selectbutton'
import { Tooltip } from 'primereact/tooltip'
import { Dropdown } from 'primereact/dropdown'

//Date Formatting tools
import { addMinutes } from '../utils/timeConverter'
import moment from 'moment'
import { ProgressBar } from 'primereact/progressbar'

const BondPage = () => {
  //Table & Dialog variables
  const [displayBasic, setDisplayBasic] = useState(false)
  const [displayVoteDialog, setDisplayVoteDialog] = useState(false)
  const [displayProposalDialog, setDisplayProposalDialog] = useState(false)
  const [displayResolveDialog, setDisplayResolveDialog] = useState(false)

  const dialogFuncMap = {
    displayBasic: setDisplayBasic,
    displayVoteDialog: setDisplayVoteDialog,
    displayProposalDialog: setDisplayProposalDialog,
    displayResolveDialog: setDisplayResolveDialog,
  }

  //Selected proposal
  const [selectedProposal, setSelectedProposal] = useState(null)

  // Loading variables
  const [createProposalLoader, setCreateProposalLoader] = useState(false)
  const [addVoteLoader, setAddVoteLoader] = useState(false)

  // Minted LTS
  const [LTS, setLTS] = useState(0)
  const [stableCoin, setStableCoin] = useState(0)
  const [NEAR, setNEAR] = useState(0)

  //Select of voting
  const [voting, setvoting] = useState('')

  const options = ['For', 'Against']

  const footer = (
    <div>
      {!selectedProposal?.list_voters.includes(window.accountId) ? (
        <Button
          label="Save"
          icon="pi pi-check"
          autoFocus
          disabled={!voting}
          onClick={() => {
            setAddVoteLoader(true)
            window.nearcondao
              .add_vote({
                proposal_title: selectedProposal.proposal_title,
                vote: voting === 'For' ? 1 : 0,
              })
              .then(() => {
                Swal.fire({
                  position: 'top-end',
                  icon: 'success',
                  title: 'Your vote has been added successfully',
                  showConfirmButton: false,
                  background: 'black',
                  iconColor: '#ffde00',
                  confirmButtonColor: 'grey',
                  timer: 2500,
                })
                onHide('displayVoteDialog')
                setAddVoteLoader(false)
              })
              .catch((err) => {
                console.error('Oops something went wrong !', err)
                setAddVoteLoader(false)
              })
          }}
        />
      ) : (
        <></>
      )}
    </div>
  )

  // Dropdown

  const [proposalType, setProposalType] = useState([])

  let proposalsTypeArray = [
    { name: 'Buy Light tokens', value: '1' },
    { name: 'Sell Light tokens', value: '2' },
    { name: 'Fund project', value: '3' },
  ]

  // List of proposals
  const [proposals, setProposals] = useState([])

  // Formik hook create proposal
  const createProposalForm = useFormik({
    initialValues: {
      proposal_type: '',
      proposal_title: '',
      description: '',
      amount: '',
      beneficiary: '',
      duration_days: '',
      duration_hours: '',
      duration_min: '',
    },
    validationSchema: Yup.object({}),
    onSubmit: (data) => {
      setCreateProposalLoader(true)

      window.nearcondao
        .create_proposal({
          proposal_type: parseInt(data.proposalType),
          proposal_title: data.proposal_title,
          description: data.description,
          amount: parseInt(data.amount),
          beneficiary: data.beneficiary,
          duration_days: parseInt(data.duration_days),
          duration_hours: parseInt(data.duration_hours),
          duration_min: parseInt(data.duration_min),
        })
        .then((res) => {
          Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: 'Your proposal has been added successfully',
            showConfirmButton: false,
            background: 'black',
            iconColor: '#ffde00',
            confirmButtonColor: 'grey',
            timer: 2500,
          })
          onHide('displayBasic')
          setCreateProposalLoader(false)
        })
        .catch((err) => {
          console.error('Oops something went wrong !', err)
          setCreateProposalLoader(false)
        })
      createProposalForm.resetForm()
    },
  })

  //use effect
  useEffect(() => {
    window.treasury.get_near_balance().then((res) => {
      setNEAR(res / 1000000000000000000000000)
    })
    window.nearcondao.get_proposals().then((proposals) => {
      let shapedList = []
      proposals.forEach((proposal) => {
        shapedList.push({
          ...proposal,
          date_creation: moment(
            new Date(proposal.time_of_creation / 1000000),
          ).format('MMMM Do YYYY, h:mm:ss a'),
          deadline: addMinutes(
            proposal.duration_days * 24 * 60 +
              proposal.duration_hours * 60 +
              proposal.duration_min,
            new Date(proposal.time_of_creation / 1000000),
          ),
          formattedDeadline: moment(
            new Date(proposal.time_of_creation / 1000000),
          )
            .add(proposal.duration_days, 'days')
            .calendar(),
          vote_is_expired:
            new Date() >
            addMinutes(
              proposal.duration_days * 24 * 60 +
                proposal.duration_hours * 60 +
                proposal.duration_min,
              new Date(proposal.time_of_creation / 1000000),
            ),
          votes_for_percentage: isNaN(
            proposal.votes_for / (proposal.votes_for + proposal.votes_against),
          )
            ? -1
            : proposal.votes_for /
              (proposal.votes_for + proposal.votes_against),
        })
      })
      setProposals(shapedList)
      console.log(shapedList)
    })
  }, [])

  const onClick = (name, rowData) => {
    dialogFuncMap[`${name}`](true)
    setSelectedProposal(rowData)
    console.log(rowData)
  }

  const onHide = (name) => {
    dialogFuncMap[`${name}`](false)
  }

  // Filters
  const [filters1, setFilters1] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
  })
  const [chartData] = useState({
    labels: ['Wrapped near ', 'Light token'],
    datasets: [
      {
        data: [50, 100],
        backgroundColor: ['#ffde00', 'black'],
        hoverBackgroundColor: ['#cdb200', 'grey'],
      },
    ],
  })

  const [lightOptions] = useState({
    plugins: {
      legend: {
        labels: {
          color: 'white',
        },
      },
    },
  })

  const filtersMap = {
    filters1: { value: filters1, callback: setFilters1 },
  }

  const renderHeader = (filtersKey) => {
    const filters = filtersMap[`${filtersKey}`].value
    const value = filters['global'] ? filters['global'].value : ''
    return (
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          type="search"
          value={value || ''}
          onChange={(e) => onGlobalFilterChange(e, filtersKey)}
          placeholder="Global Search"
        />
      </span>
    )
  }

  const onGlobalFilterChange = (event, filtersKey) => {
    const value = event.target.value
    let filters = { ...filtersMap[filtersKey].value }
    filters['global'].value = value

    filtersMap[filtersKey].callback(filters)
  }

  const header1 = renderHeader('filters1')

  const rightToolbarTemplate = () => {
    return (
      <React.Fragment>
        <Button
          label="Create proposal"
          icon="pi pi-upload"
          style={{ backgroundColor: '#ffde00' }}
          className="p-button-help"
          onClick={() => onClick('displayBasic')}
        />
      </React.Fragment>
    )
  }

  const actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment>
        <div className="container mt-4">
          <div className="row">
            <div className="col-md-4">
              <Button
                label="View"
                className="btn p-button-success mr-2"
                onClick={() => onClick('displayProposalDialog', rowData)}
              />
            </div>
            <div className="col-md-4">
              <Button
                label="Vote"
                className="btn mr-2"
                style={{ backgroundColor: '#ffde00' }}
                onClick={() => onClick('displayVoteDialog', rowData)}
                disabled={rowData.vote_is_expired}
              />
            </div>
            {rowData?.vote_is_expired ? (
              <div className="col-md-4">
                <Button
                  label="Resolve"
                  className="btn mr-2"
                  style={{ backgroundColor: '#32a877' }}
                  onClick={() => onClick('displayResolveDialog', rowData)}
                />
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
        &nbsp;
      </React.Fragment>
    )
  }

  const proposalTypeTemplate = (rowData) => {
    return (
      <React.Fragment>
        {rowData.proposal_type === 1 ? (
          <>Buy LTS</>
        ) : rowData.proposal_type === 2 ? (
          <>Sell LTS</>
        ) : (
          <> Fund project</>
        )}
      </React.Fragment>
    )
  }

  const liveBodyTemplate = (rowData) => {
    return (
      <>
        {!rowData.vote_is_expired ? (
          <Button
            label="Live"
            className="p-button-rounded p-button-success mr-2 button-live"
            disabled
            style={{ color: 'white' }}
          />
        ) : (
          <></>
        )}
      </>
    )
  }

  const proposalsActionTemplate = (rowData) => {
    return (
      <Button
        label="Buy"
        className="btn mr-2"
        style={{ backgroundColor: '#ffde00' }}
        onClick={() => {
          ////// STEP 3
          // window.fund
          //   .swap({
          //     amount: 10,
          //     msg:
          //       '"{"force":0,"actions":[{"pool_id":49,"token_in":"wrap.testnet","token_out":"dai.fakes.testnet","amount_in":"10000000000000000000000000","min_amount_out":"0"},{"pool_id":218,"token_in":"dai.fakes.testnet","token_out":"usdc.fakes.testnet","min_amount_out":"0"}]}"',
          //   })
          //   .then((res) => {
          //     console.log(res)
          //   })
          ///// SETP4
          //   window.fund
          //     .get_num_tokens_minted({ amount: 100000, supply: 100 })
          //     .then((res) => {
          //       setLTS(Math.round(res - 100))
          //     })
          ///// STEP 5
          // window.fund.mint_lts({ amount: 9 * 100000000 }).then((res) => {
          //   console.log('first')
          // })
          //// STEP 6
          //window.fund.transfer_lts({ amount: 9 * 100000000 }).then((res) => {})
        }}
      />
    )
  }

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-6">
          <Section>
            <div className="title-container">
              <div className="title">
                <h4>Treasury assets</h4>
              </div>
            </div>

            <div className="flex justify-content-center">
              <Chart
                type="pie"
                data={chartData}
                options={lightOptions}
                style={{
                  position: 'relative',
                  width: '60%',
                  transform: 'translateX(6rem)',
                }}
              />
            </div>
          </Section>
        </div>
        <div className="col-md-6">
          <Section>
            <div className="mt-4" style={{ paddingTop: '6.5rem' }}>
              <h4 className="text-center">Near Balance</h4>
              <p
                style={{
                  fontSize: '4rem',
                }}
                className="text-center"
              >
                {Math.round(NEAR* 100) / 100}
                <img
                  src="https://s3-us-west-1.amazonaws.com/compliance-ico-af-us-west-1/production/token_profiles/logos/original/9d5/c43/cc-/9d5c43cc-e232-4267-aa8a-8c654a55db2d-1608222929-b90bbe4696613e2faeb17d48ac3aa7ba6a83674a.png"
                  width="80"
                />
              </p>
            </div>
          </Section>
        </div>
      </div>
      <div className="row">
        <div className="col-md-12">
          <Section className="mt-4">
            <div className="title-container">
              <div className="title">
                <h4>Proposals</h4>
              </div>
            </div>
            {/* selection={selectedProposal} */}
            <Toolbar
              className="mb-4 mt-4"
              right={rightToolbarTemplate}
            ></Toolbar>

            <DataTable
              className="mt-4"
              value={proposals}
              responsiveLayout="scroll"
              paginator
              rows={10}
              header={header1}
              filters={filters1}
              onFilter={(e) => setFilters1(e.filters)}
              onSelectionChange={(e) => setSelectedProposal(e.value)}
              dataKey="id"
              stateStorage="session"
              stateKey="dt-state-demo-session"
              emptyMessage={'No proposals'}
            >
              <Column field="proposal_title" header="Title"></Column>
              <Column header="Type" body={proposalTypeTemplate}></Column>
              <Column field="votes_against" header="Votes against"></Column>
              <Column field="votes_for" header="Votes for"></Column>
              <Column field="amount" header="Amount"></Column>
              <Column
                field="formattedDeadline"
                header="Deadline"
                sortable
              ></Column>
              <Column header="" body={actionBodyTemplate}></Column>
              <Column
                field="vote_is_expired"
                header=""
                body={liveBodyTemplate}
              ></Column>
            </DataTable>
          </Section>
        </div>

        <Dialog
          header="Create a proposal"
          visible={displayBasic}
          style={{ width: '50vw' }}
          onHide={() => onHide('displayBasic')}
        >
          <form onSubmit={createProposalForm.handleSubmit}>
            <div className="row mt-4">
              <div className="col-md-6">
                <span className="p-float-label grid-item">
                  <InputText
                    id="proposal_title"
                    value={createProposalForm.values.proposal_title}
                    onChange={createProposalForm.handleChange}
                    onBlur={createProposalForm.handleBlur}
                    tooltip="Enter the title of the proposal"
                    tooltipOptions={{
                      position: 'bottom',
                      mouseTrack: true,
                      mouseTrackTop: 15,
                    }}
                    className={classNames({
                      'p-invalid':
                        createProposalForm.touched.proposal_title &&
                        createProposalForm.errors.proposal_title,
                    })}
                  />

                  <label
                    htmlFor="proposal_title"
                    className={classNames({
                      'p-error':
                        createProposalForm.touched.proposal_title &&
                        createProposalForm.errors.proposal_title,
                    })}
                  >
                    {createProposalForm.touched.proposal_title &&
                    createProposalForm.errors.proposal_title
                      ? createProposalForm.errors.proposal_title
                      : 'Title'}
                  </label>
                </span>
              </div>
              <div className="col-md-6">
                <span className="p-float-label grid-item">
                  <Dropdown
                    id="proposalType"
                    name="proposalType"
                    value={createProposalForm.values.proposalType}
                    onChange={createProposalForm.handleChange}
                    options={proposalsTypeArray}
                    style={{ width: '200px' }}
                    optionLabel="name"
                    tooltip="Choose one type"
                    tooltipOptions={{
                      position: 'bottom',
                      mouseTrack: true,
                      mouseTrackTop: 15,
                    }}
                  />
                  <label htmlFor="proposalType">Type of proposal</label>
                  {/* <InputText
                    id="proposal_type"
                    value={createProposalForm.values.proposal_type}
                    onChange={createProposalForm.handleChange}
                    onBlur={createProposalForm.handleBlur}
                    tooltip="Enter your username"
                    tooltipOptions={{
                      position: 'bottom',
                      mouseTrack: true,
                      mouseTrackTop: 15,
                    }}
                    className={classNames({
                      'p-invalid':
                        createProposalForm.touched.proposal_type &&
                        createProposalForm.errors.proposal_type,
                    })}
                  />

                  <label
                    htmlFor="proposal_type"
                    className={classNames({
                      'p-error':
                        createProposalForm.touched.proposal_type &&
                        createProposalForm.errors.proposal_type,
                    })}
                  >
                    {createProposalForm.touched.proposal_type &&
                    createProposalForm.errors.proposal_type
                      ? createProposalForm.errors.proposal_type
                      : 'Type'}
                  </label> */}
                </span>
              </div>
              <div className="col-md-6 mt-4" style={{ paddingTop: '10px' }}>
                <span className="p-float-label grid-item">
                  <InputText
                    id="description"
                    value={createProposalForm.values.description}
                    onChange={createProposalForm.handleChange}
                    onBlur={createProposalForm.handleBlur}
                    tooltip="Enter the description"
                    tooltipOptions={{
                      position: 'bottom',
                      mouseTrack: true,
                      mouseTrackTop: 15,
                    }}
                    className={classNames({
                      'p-invalid':
                        createProposalForm.touched.description &&
                        createProposalForm.errors.description,
                    })}
                  />

                  <label
                    htmlFor="description"
                    className={classNames({
                      'p-error':
                        createProposalForm.touched.description &&
                        createProposalForm.errors.description,
                    })}
                  >
                    {createProposalForm.touched.description &&
                    createProposalForm.errors.description
                      ? createProposalForm.errors.description
                      : 'Description'}
                  </label>
                </span>
              </div>
              <div className="col-md-6 mt-4" style={{ paddingTop: '10px' }}>
                <span className="p-float-label grid-item">
                  <InputText
                    id="amount"
                    value={createProposalForm.values.amount}
                    onChange={createProposalForm.handleChange}
                    onBlur={createProposalForm.handleBlur}
                    tooltip="Enter the amount"
                    tooltipOptions={{
                      position: 'bottom',
                      mouseTrack: true,
                      mouseTrackTop: 15,
                    }}
                    className={classNames({
                      'p-invalid':
                        createProposalForm.touched.amount &&
                        createProposalForm.errors.amount,
                    })}
                  />

                  <label
                    htmlFor="amount"
                    className={classNames({
                      'p-error':
                        createProposalForm.touched.amount &&
                        createProposalForm.errors.amount,
                    })}
                  >
                    {createProposalForm.touched.amount &&
                    createProposalForm.errors.amount
                      ? createProposalForm.errors.amount
                      : 'Amount'}
                  </label>
                </span>
              </div>
              <div className="col-md-6 mt-4" style={{ paddingTop: '10px' }}>
                <span className="p-float-label grid-item">
                  <InputText
                    id="beneficiary"
                    value={createProposalForm.values.beneficiary}
                    onChange={createProposalForm.handleChange}
                    onBlur={createProposalForm.handleBlur}
                    tooltip="If there is no beneficiary leave it empty"
                    tooltipOptions={{
                      position: 'bottom',
                      mouseTrack: true,
                      mouseTrackTop: 15,
                    }}
                    className={classNames({
                      'p-invalid':
                        createProposalForm.touched.beneficiary &&
                        createProposalForm.errors.beneficiary,
                    })}
                  />

                  <label
                    htmlFor="beneficiary"
                    className={classNames({
                      'p-error':
                        createProposalForm.touched.beneficiary &&
                        createProposalForm.errors.beneficiary,
                    })}
                  >
                    {createProposalForm.touched.beneficiary &&
                    createProposalForm.errors.beneficiary
                      ? createProposalForm.errors.beneficiary
                      : 'Beneficiary'}
                  </label>
                </span>
              </div>
              <div className="col-md-6 mt-4" style={{ paddingTop: '10px' }}>
                <span className="p-float-label grid-item">
                  <InputText
                    id="duration_days"
                    value={createProposalForm.values.duration_days}
                    onChange={createProposalForm.handleChange}
                    onBlur={createProposalForm.handleBlur}
                    tooltip="Enter how many days until the deadline"
                    tooltipOptions={{
                      position: 'bottom',
                      mouseTrack: true,
                      mouseTrackTop: 15,
                    }}
                    className={classNames({
                      'p-invalid':
                        createProposalForm.touched.duration_days &&
                        createProposalForm.errors.duration_days,
                    })}
                  />

                  <label
                    htmlFor="duration_days"
                    className={classNames({
                      'p-error':
                        createProposalForm.touched.duration_days &&
                        createProposalForm.errors.duration_days,
                    })}
                  >
                    {createProposalForm.touched.duration_days &&
                    createProposalForm.errors.duration_days
                      ? createProposalForm.errors.duration_days
                      : 'Days duration'}
                  </label>
                </span>
              </div>
              <div className="col-md-6 mt-4" style={{ paddingTop: '10px' }}>
                <span className="p-float-label grid-item">
                  <InputText
                    id="duration_hours"
                    value={createProposalForm.values.duration_hours}
                    onChange={createProposalForm.handleChange}
                    onBlur={createProposalForm.handleBlur}
                    tooltip="Enter how many hours until the deadline"
                    tooltipOptions={{
                      position: 'bottom',
                      mouseTrack: true,
                      mouseTrackTop: 15,
                    }}
                    className={classNames({
                      'p-invalid':
                        createProposalForm.touched.duration_hours &&
                        createProposalForm.errors.duration_hours,
                    })}
                  />

                  <label
                    htmlFor="duration_hours"
                    className={classNames({
                      'p-error':
                        createProposalForm.touched.duration_hours &&
                        createProposalForm.errors.duration_hours,
                    })}
                  >
                    {createProposalForm.touched.duration_hours &&
                    createProposalForm.errors.duration_hours
                      ? createProposalForm.errors.duration_hours
                      : 'Hours duration'}
                  </label>
                </span>
              </div>
              <div className="col-md-6 mt-4" style={{ paddingTop: '10px' }}>
                <span className="p-float-label grid-item">
                  <InputText
                    id="duration_min"
                    value={createProposalForm.values.duration_min}
                    onChange={createProposalForm.handleChange}
                    onBlur={createProposalForm.handleBlur}
                    tooltip="Enter how many minutes until the deadline"
                    tooltipOptions={{
                      position: 'bottom',
                      mouseTrack: true,
                      mouseTrackTop: 15,
                    }}
                    className={classNames({
                      'p-invalid':
                        createProposalForm.touched.duration_min &&
                        createProposalForm.errors.duration_min,
                    })}
                  />

                  <label
                    htmlFor="duration_min"
                    className={classNames({
                      'p-error':
                        createProposalForm.touched.duration_min &&
                        createProposalForm.errors.duration_min,
                    })}
                  >
                    {createProposalForm.touched.duration_min &&
                    createProposalForm.errors.duration_min
                      ? createProposalForm.errors.duration_min
                      : 'Minutes duration'}
                  </label>
                </span>
              </div>
            </div>
            <div
              className="mt-4"
              style={{ display: 'flex', justifyContent: 'right' }}
            >
              <Button
                label="No"
                icon="pi pi-times"
                onClick={() => onHide('displayBasic')}
                className="p-button-text"
              />
              <Button label="Yes" icon="pi pi-check" type="submit" autoFocus />
            </div>
          </form>
        </Dialog>
        <Dialog
          header="Vote"
          footer={footer}
          visible={displayVoteDialog}
          style={{ width: '50vw' }}
          onHide={() => onHide('displayVoteDialog')}
        >
          <div className="container">
            <div className="row">
              <div className="col-md-12">
                {!selectedProposal?.list_voters.includes(window.accountId) ? (
                  <>
                    <h6 className="text-center mb-2">
                      Are you voting for or against this proposal ?
                    </h6>
                    <span className="text-center">
                      <SelectButton
                        value={voting}
                        options={options}
                        className="mt-4"
                        onChange={(e) => setvoting(e.value)}
                      />
                    </span>
                  </>
                ) : (
                  <>
                    {' '}
                    <h6 className="text-center mb-2">
                      You already voted ! Thank you for that !{' '}
                    </h6>
                  </>
                )}
              </div>
            </div>
          </div>
        </Dialog>
        <Dialog
          header={selectedProposal?.proposal_title}
          visible={displayProposalDialog}
          style={{ width: '50vw' }}
          onHide={() => onHide('displayProposalDialog')}
          maximizable
          modal
        >
          <div className="container">
            <div className="row">
              <div className="col-md-6">
                <h6 style={{ opacity: '50%' }}>Proposer :</h6>
                <p className="m-0">{selectedProposal?.proposal_creator}</p>
              </div>
              <div className="col-md-6">
                <h6 style={{ opacity: '50%' }}>Title :</h6>
                <p className="m-0">{selectedProposal?.proposal_title}</p>
              </div>
              <div className="col-md-12 mt-4">
                <h6 style={{ opacity: '50%' }}>Description :</h6>
                <p className="m-0">{selectedProposal?.description}</p>
              </div>

              <div className="col-md-12 mt-4">
                <Tooltip target=".Not" mouseTrack mouseTrackLeft={10} />
                <p
                  className="Not"
                  data-pr-tooltip="Not"
                  style={{ float: 'right', margin: '5px' }}
                >
                  <IconContainerNot>
                    <RiTempColdLine className="mb-4" />
                  </IconContainerNot>
                </p>
                <Tooltip target=".Hot" mouseTrack mouseTrackLeft={10} />
                <p
                  className="Hot"
                  data-pr-tooltip="Hot"
                  style={{ float: 'left', margin: '5px' }}
                >
                  <IconContainerHot>
                    <FaHotjar className="mb-4" />
                  </IconContainerHot>
                </p>
              </div>

              <div className="col-md-12">
                {/* {selectedProposal?.votes_for_percentage > 0 ? ( */}
                <ProgressBar
                  value={
                    selectedProposal?.votes_for_percentage > 0
                      ? selectedProposal?.votes_for_percentage * 100
                      : 0
                  }
                  showValue={false}
                />
                {/* ) : (
                  <p className="text-center mt-4">Voting didn't started yet</p>
                )} */}
              </div>
              <div className="col-md-12 mt-4">
                <h6 className="text-center" style={{ opacity: '50%' }}>
                  Deadline :
                </h6>

                <p className="text-center">
                  {/* {selectedProposal?.formattedDeadline} */}
                </p>
              </div>
            </div>
          </div>
        </Dialog>
        <Dialog
          header="Buy LTS"
          visible={displayResolveDialog}
          style={{ width: '50vw' }}
          onHide={() => onHide('displayResolveDialog')}
          maximizable
          modal
        >
          {selectedProposal?.proposal_type === 1 ? (
            <div className="container">
              <div className="row">
                <div className="col-md-3">
                  <Button
                    label="Deposit crypto"
                    className="btn mr-2"
                    style={{ backgroundColor: '#ffde00' }}
                    onClick={() => {
                      /////// STEP 1
                      window.treasury.deposit_crypto({ amount: 1 }).then(() => {
                        console.log('Crypto deposited ')
                      })
                    }}
                  />
                </div>
                <div className="col-md-3">
                  <Button
                    label="Swap to stable"
                    className="btn mr-2"
                    style={{ backgroundColor: '#ffde00' }}
                    onClick={() => {
                      /////// STEP 3
                      window.fund
                        .swap({
                          amount: 10,
                          msg:
                            '"{"force":0,"actions":[{"pool_id":49,"token_in":"wrap.testnet","token_out":"dai.fakes.testnet","amount_in":"10000000000000000000000000","min_amount_out":"0"},{"pool_id":218,"token_in":"dai.fakes.testnet","token_out":"usdc.fakes.testnet","min_amount_out":"0"}]}"',
                        })
                        .then((res) => {
                          console.log(res)
                        })
                    }}
                  />{' '}
                </div>

                <div className="col-md-3 ">
                  <Button
                    label="Calculate Price "
                    className="btn mr-2"
                    style={{ backgroundColor: '#ffde00' }}
                    onClick={() => {
                      /////// STEP 4
                      window.fund
                        .get_num_tokens_minted({ amount: 100000, supply: 100 })
                        .then((res) => {
                          setLTS(Math.round(res - 100))
                        })
                    }}
                  />{' '}
                </div>

                <div className="col-md-3 ">
                  <Button
                    label="Mint LTS"
                    className="btn mr-2"
                    style={{ backgroundColor: '#ffde00' }}
                    onClick={() => {
                      //STEP 5
                      window.fund
                        .mint_lts({ amount: 9 * 100000000 })
                        .then((res) => {
                          console.log('first')
                        })
                    }}
                  />{' '}
                </div>
                <div className="col-md-3 mt-4">
                  <Button
                    label="Transfer LTS"
                    className="btn mr-2"
                    style={{ backgroundColor: '#ffde00' }}
                    onClick={() => {
                      //STEP 5
                      window.fund
                        .transfer_lts({ amount: 9 * 100000000 })
                        .then((res) => {})
                    }}
                  />{' '}
                </div>
              </div>
            </div>
          ) : selectedProposal?.proposal_type === 2 ? (
            <div className="container">
              <div className="row">
                <div className="col-md-3">
                  <Button
                    label="Transfer LTS"
                    className="btn mr-2"
                    style={{ backgroundColor: '#ffde00' }}
                    onClick={() => {
                      /////// STEP 1
                      window.treasury
                        .transfer_lts({ amount: 1 * 100000000 })
                        .then(() => {
                          console.log('LTS transfered ')
                        })
                    }}
                  />
                </div>
                <div className="col-md-3">
                  <Button
                    label="Transfer LTS"
                    className="btn mr-2"
                    style={{ backgroundColor: '#ffde00' }}
                    onClick={() => {
                      /////// STEP 1
                      window.treasury
                        .transfer_lts({ amount: 1 * 100000000 })
                        .then(() => {
                          console.log('LTS transfered ')
                        })
                    }}
                  />
                </div>
                <div className="col-md-3">
                  <Button
                    label="Burn LTS"
                    className="btn mr-2"
                    style={{ backgroundColor: '#ffde00' }}
                    onClick={() => {
                      /////// STEP 2
                      window.fund
                        .burn_token({ amount: 1 * 100000000 })
                        .then(() => {
                          console.log('LTS burned ')
                        })
                    }}
                  />
                </div>
                <div className="col-md-3">
                  <Button
                    label="calculate price"
                    className="btn mr-2"
                    style={{ backgroundColor: '#ffde00' }}
                    onClick={() => {
                      /////// STEP 2
                      window.fund
                        .get_num_tokens_burned({ amount: 100000, supply: 100 })
                        .then((res) => {
                          setStableCoin(Math.round(res - 100))
                        })
                    }}
                  />
                </div>
                <div className="col-md-3">
                  <Button
                    label="Send stable coins"
                    className="btn mr-2"
                    style={{ backgroundColor: '#ffde00' }}
                    onClick={() => {
                      /////// STEP 2
                      window.fund
                        .get_num_tokens_burned({ amount: 100000, supply: 100 })
                        .then((res) => {
                          setStableCoin(Math.round(res - 100))
                        })
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="col-md-3">
                <Button
                  label="Fund the project"
                  className="btn mr-2"
                  style={{ backgroundColor: '#ffde00' }}
                  onClick={() => {
                    /////// STEP 2
                    window.treasury
                      .pay({
                        amount: selectedProposal?.amount,
                        to: selectedProposal?.beneficiary,
                      })
                      .then((res) => {
                        console.log('success')
                      })
                  }}
                />
              </div>
            </>
          )}
        </Dialog>
      </div>
    </div>
  )
}

const Section = styled.section`
  background-color: black;
  border-radius: 1rem;
  padding: 1rem;
  height: 100%;
  width: 100%;
  .p-menuitem-link {
    :hover {
      .p-menuitem-text {
        color: #ffde00;
      }
      .p-menuitem-icon {
        color: #ffde00;
      }
    }
  }
`

export const IconContainerNot = styled.span`
  transition: 0.5s ease-in-out;
  :hover {
    svg {
      color: #ffde00;
    }
  }
`

export const IconContainerHot = styled.span`
  color: #ffde00;
  transition: 0.5s ease-in-out;
  :hover {
    svg {
      color: grey;
    }
  }
`
export default BondPage
