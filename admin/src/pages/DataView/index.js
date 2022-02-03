import React, { memo, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useHistory } from "react-router-dom";
import { request } from "@strapi/helper-plugin";
import { isObject } from "lodash";
import { Table, Button, Select } from "@buffetjs/core";
import { LoadingBar } from "@buffetjs/styles";
import Wrapper from "./Wrapper";

const LIMIT_OPTIONS = ["10", "20", "50", "100"];

const DataView = ({
  data = [],
  activeModel = "",
  loading,
  page,
  limit,
  totalCount,
  onChangeParams,
  isMigrateActive,
  isDeleted,
  isCreated,
  refreshData,
}) => {
  const history = useHistory();
  const tableHeaders = useMemo(
    () =>
      data && data.length
        ? Object.keys(data[0]).map((d) => ({ name: d, value: d }))
        : [],
    [data]
  );

  const tableData = useMemo(
    () =>
      data && data.length
        ? data.map((dataObject) => {
            let newObj = {};
            if (!dataObject) return newObj;

            for (let key in dataObject) {
              if (isObject(dataObject[key])) {
                newObj[key] = JSON.stringify(dataObject[key], null, 2);
              } else {
                newObj[key] = dataObject[key];
              }
            }

            return newObj;
          })
        : [],
    [data]
  );

  const [isMigrating, setIsMigrating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const migrate = (model) => {
    setIsMigrating(true);
    request(`/elastic/migrate-model`, {
      method: "POST",
      body: { model },
    })
      .then((res) => {
        if (res.success) {
          strapi.notification.success(`${model} model migrated successfully`);
          refreshData();
        } else strapi.notification.error(`migration failed`);
      })
      .catch(() => strapi.notification.error(`migration failed`))
      .finally(() => setIsMigrating(false));
  };

  const deleteIndex = (model) => {
    setIsDeleting(true);
    request(`/elastic/delete-index`, {
      method: "POST",
      body: { model },
    })
      .then((res) => {
        if (res.success) {
          refreshData();
          strapi.notification.success(`${model} index deleted`);
        } else {
          strapi.notification.error(`cannot delete ${model} index`);
        }
      })
      .catch(() => {
        strapi.notification.error(`cannot delete ${model} index`);
      })
      .finally(() => setIsDeleting(false));
  };

  const createIndex = (model) => {
    setIsCreating(true);
    request(`/elastic/create-index`, {
      method: "POST",
      body: { model },
    })
      .then((res) => {
        refreshData();
        if (res.success) {
          strapi.notification.success(`${model} index created`);
        } else {
          strapi.notification.error(`cannot create ${model} index`);
        }
      })
      .catch(() => strapi.notification.error(`cannot create ${model} index`))
      .finally(() => setIsCreating(false));
  };

  return (
    <Wrapper>
      <div className="row px-4">
        <h2>{activeModel?.index?.toUpperCase()}</h2>
        <Button
          color="success"
          isLoading={isMigrating}
          onClick={() => {
            migrate(activeModel.model);
          }}
          className="ml-auto"
          disabled={!isMigrateActive}
        >
          migrate
        </Button>
        <Button
          color="primary"
          isLoading={isCreating}
          disabled={isCreated}
          onClick={() => {
            createIndex(activeModel.model);
          }}
          className="ml-2"
        >
          create
        </Button>
        <Button
          color="delete"
          isLoading={isDeleting}
          disabled={isDeleted}
          onClick={() => {
            deleteIndex(activeModel.model);
          }}
          className="ml-2"
        >
          delete
        </Button>
      </div>
      <hr />
      {loading ? (
        new Array(10).fill(0).map(() => (
          <>
            <LoadingBar />
            <div className="mt-3" />
          </>
        ))
      ) : (
        <>
          <Table
            headers={tableHeaders}
            rows={tableData}
            onClickRow={(e, data) =>
              history.push(
                `/plugins/content-manager/collectionType/${
                  activeModel?.plugin
                    ? `plugins::${activeModel?.plugin}.${activeModel?.model}`
                    : `application::${activeModel?.model}.${activeModel?.model}`
                }/${data.id}`
              )
            }
          />
          <div className="mt-5 row align-items-center px-2">
            <Select
              name="params._limit"
              onChange={onChangeParams}
              options={LIMIT_OPTIONS}
              value={limit}
              className="col-2"
            />
            {/* <div className="col-8 ml-auto">
              <GlobalPagination
                count={totalCount}
                onChangeParams={onChangeParams}
                params={{
                  _limit: parseInt(limit || 10, 10),
                  _page: page,
                }}
              />
            </div> */}
          </div>
        </>
      )}
    </Wrapper>
  );
};

DataView.propTypes = {
  data: PropTypes.array.isRequired,
  refreshData: PropTypes.func.isRequired,
  activeModel: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
  page: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  limit: PropTypes.string.isRequired,
  onChangeParams: PropTypes.func.isRequired,
  isMigrateActive: PropTypes.bool.isRequired,
  isDeleted: PropTypes.bool.isRequired,
  isCreated: PropTypes.bool.isRequired,
};

export default memo(DataView);
