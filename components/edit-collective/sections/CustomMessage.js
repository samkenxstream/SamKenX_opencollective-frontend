import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import MessageBox from '../../MessageBox';
import PreviewModal from '../../PreviewModal';
import RichTextEditor from '../../RichTextEditor';
import StyledButton from '../../StyledButton';
import StyledHr from '../../StyledHr';
import { P, Span } from '../../Text';
import { TOAST_TYPE, useToasts } from '../../ToastProvider';

const updateCustomMessageMutation = gqlV2/* GraphQL */ `
  mutation UpdateCustomMessage($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      type
      isActive
      settings
    }
  }
`;

const CustomMessage = ({ collective }) => {
  const thankYouMessage =
    collective?.settings?.customEmailMessage?.thankYou ||
    collective?.parentCollective?.settings?.customEmailMessage?.thankYou;
  const [customMessage, setCustomMessage] = useState(thankYouMessage);
  const [isModified, setIsModified] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { addToast } = useToasts();

  const [updateCustomEmailMessage, { loading }] = useMutation(updateCustomMessageMutation, {
    context: API_V2_CONTEXT,
    onError: e => {
      addToast({
        type: TOAST_TYPE.ERROR,
        message: (
          <FormattedMessage
            defaultMessage="Error updating custom email message: {error}"
            values={{
              error: e.message,
            }}
          />
        ),
      });
    },
    onCompleted: () => {
      addToast({
        type: TOAST_TYPE.SUCCESS,
        message: <FormattedMessage defaultMessage="Email message updated" />,
      });
    },
  });

  const handleSubmit = async message => {
    await updateCustomEmailMessage({
      variables: {
        account: { legacyId: collective.id },
        key: 'customEmailMessage.thankYou',
        value: message || '',
      },
    });
    setIsModified(false);
  };

  const onChange = async value => {
    setCustomMessage(value);
    setIsModified(true);
  };

  return (
    <Container>
      <P fontSize="14px" fontWeight={400} lineHeight="20ppx">
        <FormattedMessage defaultMessage="Add a custom message to be included in the email sent to financial contributors of your Collective, Project, or Event." />
      </P>
      <StyledHr mt="32px" mb="34px" borderStyle="dotted" />
      <Container maxWidth="1000px">
        <Flex justifyContent="space-between" flexDirection={['column', 'row']}>
          <Box mb={2} fontSize="18px" fontWeight={700} lineHeight="26px">
            <FormattedMessage defaultMessage="Custom Message" />
          </Box>
          <StyledButton
            buttonStyle="secondary"
            buttonSize="tiny"
            maxWidth="78px"
            pt="4px"
            pb="4px"
            pl="14px"
            pr="14px"
            height="24px"
            onClick={() => setShowPreview(true)}
          >
            <Span fontSize="13px" fontWeight={500} lineHeight="16px">
              <FormattedMessage defaultMessage="Preview" />
            </Span>
          </StyledButton>
        </Flex>
        <RichTextEditor
          inputName="message"
          onChange={e => onChange(e.target.value)}
          defaultValue={customMessage}
          withBorders
          editorMinHeight="150px"
          maxLength={500}
          showCount
        />
      </Container>
      {[CollectiveType.EVENT, CollectiveType.PROJECT].includes(collective.type) ? (
        <MessageBox type="info" mt="24px">
          <P fontSize="13px" fontWeight={400} lineHeight="20px">
            <FormattedMessage defaultMessage="The above text will override the customized message set by the parent Collective of this Event or Project." />
          </P>
        </MessageBox>
      ) : (
        <MessageBox type="info" mt="24px">
          <P fontSize="13px" fontWeight={400} lineHeight="20px">
            <FormattedMessage defaultMessage="The above text will be considered as the default customized email response for all contributions to your Collective, and all of your Events and Projects. You also have the ability to customize the messages for Events & Projects from within their individual Setting's Menus." />
          </P>
        </MessageBox>
      )}
      <Flex justifyContent={['center', 'left']}>
        <StyledButton
          disabled={loading || !isModified}
          mt="35px"
          buttonStyle="primary"
          width="157px"
          onClick={() => handleSubmit(customMessage)}
        >
          <FormattedMessage id="save" defaultMessage="Save" />
        </StyledButton>
      </Flex>
      {showPreview && (
        <PreviewModal
          heading={<FormattedMessage defaultMessage="Preview Notification" />}
          subheading={
            <FormattedMessage defaultMessage="This is the preview of the email template which your financial contributor will receive." />
          }
          onClose={() => setShowPreview(false)}
          previewImage="/static/images/custom-email-preview.png"
          imgHeight="715px"
          imgWidth="809px"
        />
      )}
    </Container>
  );
};

CustomMessage.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.number,
    type: PropTypes.string,
    settings: PropTypes.shape({
      customEmailMessage: PropTypes.shape({
        thankYou: PropTypes.string,
      }),
    }),
    parentCollective: PropTypes.shape({
      settings: PropTypes.shape({
        customEmailMessage: PropTypes.shape({
          thankYou: PropTypes.string,
        }),
      }),
    }),
  }),
  isInheritSettings: PropTypes.bool,
};

export default CustomMessage;
